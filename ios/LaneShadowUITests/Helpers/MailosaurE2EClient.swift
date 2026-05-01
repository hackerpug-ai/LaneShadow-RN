import Foundation

struct MailosaurE2EClient {
    let apiKey: String
    let serverID: String

    func pollVerificationCode(sentTo email: String, receivedAfter: Date,
                              timeout: TimeInterval = 90) async throws -> String
    {
        let deadline = Date().addingTimeInterval(timeout)
        var lastError: Error?

        while Date() < deadline {
            do {
                if let messageID = try await searchMessageID(sentTo: email, receivedAfter: receivedAfter),
                   let code = try await retrieveCode(messageID: messageID)
                {
                    return code
                }
            } catch {
                lastError = error
            }

            try await Task.sleep(nanoseconds: 3_000_000_000)
        }

        if let lastError {
            throw lastError
        }
        throw MailosaurE2EError.codeNotFound(email)
    }

    private func searchMessageID(sentTo email: String, receivedAfter: Date) async throws -> String? {
        var components = URLComponents(string: "https://mailosaur.com/api/messages/search")!
        components.queryItems = [
            URLQueryItem(name: "server", value: serverID),
            URLQueryItem(name: "itemsPerPage", value: "10"),
            URLQueryItem(name: "receivedAfter", value: Self.iso8601String(from: receivedAfter)),
        ]

        var request = URLRequest(url: components.url!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(authorizationHeader, forHTTPHeaderField: "Authorization")
        request.httpBody = try JSONSerialization.data(withJSONObject: ["sentTo": email])

        let json = try await performJSONRequest(request)
        let items = (json["items"] as? [[String: Any]]) ?? []
        return items.first?["id"] as? String
    }

    private func retrieveCode(messageID: String) async throws -> String? {
        var request = URLRequest(url: URL(string: "https://mailosaur.com/api/messages/\(messageID)")!)
        request.setValue(authorizationHeader, forHTTPHeaderField: "Authorization")

        let json = try await performJSONRequest(request)
        let subject = json["subject"] as? String ?? ""
        let textBody = (json["text"] as? [String: Any])?["body"] as? String ?? ""
        let htmlBody = (json["html"] as? [String: Any])?["body"] as? String ?? ""
        return Self.extractCode(from: [subject, textBody, htmlBody].joined(separator: "\n"))
    }

    private func performJSONRequest(_ request: URLRequest) async throws -> [String: Any] {
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse,
              (200 ..< 300).contains(httpResponse.statusCode)
        else {
            throw MailosaurE2EError.invalidResponse
        }

        let value = try JSONSerialization.jsonObject(with: data)
        return value as? [String: Any] ?? [:]
    }

    private var authorizationHeader: String {
        let token = Data("\(apiKey):".utf8).base64EncodedString()
        return "Basic \(token)"
    }

    private static func iso8601String(from date: Date) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter.string(from: date)
    }

    private static func extractCode(from body: String) -> String? {
        let regex = try? NSRegularExpression(pattern: "\\b\\d{6}\\b")
        let range = NSRange(body.startIndex ..< body.endIndex, in: body)
        guard let match = regex?.firstMatch(in: body, range: range),
              let codeRange = Range(match.range, in: body)
        else {
            return nil
        }
        return String(body[codeRange])
    }
}

enum MailosaurE2EError: LocalizedError {
    case invalidResponse
    case codeNotFound(String)

    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            "Mailosaur returned an invalid response."
        case let .codeNotFound(email):
            "Timed out waiting for a Mailosaur verification code for \(email)."
        }
    }
}
