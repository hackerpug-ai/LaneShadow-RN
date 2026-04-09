/**
 * MLX Native Module Bridge
 *
 * This file documents the native module interface that must be implemented
 * in Swift (iOS) and Kotlin (Android) to bridge React Native to MLX framework.
 *
 * iOS Implementation (Swift):
 * --------------------------
 * File: ios/MLXModelBridge.swift
 *
 * import MLX
 * import MLXNN
 * import React
 *
 * @objc(MLXModelBridge)
 * class MLXModelBridge: NSObject, RCTBridgeModule {
 *
 *   @objc
 *   static func requiresMainQueueSetup() -> Bool {
 *     return false  // Run on background thread
 *   }
 *
 *   private var model: MLXNN.Module?
 *   private var modelPath: String?
 *
 *   @objc
 *   func loadModel(_ modelPath: String,
 *                  resolver: @escaping RCTPromiseResolveBlock,
 *                  rejecter: @escaping RCTPromiseRejectBlock) {
 *     DispatchQueue.global(qos: .userInitiated).async {
 *       do {
 *         // Load Qwen3.5 0.8B model using MLX
 *         self.model = try MLXNN.load(modelPath)
 *         self.modelPath = modelPath
 *
 *         resolver(["success": true])
 *       } catch {
 *         rejecter("LOAD_ERROR", error.localizedDescription, error)
 *       }
 *     }
 *   }
 *
 *   @objc
 *   func runInference(_ modelPath: String,
 *                     input: String,
 *                     resolver: @escaping RCTPromiseResolveBlock,
 *                     rejecter: @escaping RCTPromiseRejectBlock) {
 *     DispatchQueue.global(qos: .userInitiated).async {
 *       let startTime = Date()
 *
 *       do {
 *         guard let model = self.model else {
 *           throw NSError(domain: "MLX", code: -1, userInfo: [
 *             NSLocalizedDescriptionKey: "Model not loaded"
 *           ])
 *         }
 *
 *         // Tokenize input
 *         let tokens = self.tokenize(input)
 *
 *         // Run inference through MLX
 *         let output = try model.generate(tokens: tokens, maxTokens: 50)
 *
 *         // Decode output
 *         let result = self.decode(output)
 *
 *         let duration = Date().timeIntervalSince(startTime) * 1000
 *
 *         resolver([
 *           "result": result,
 *           "durationMs": duration
 *         ])
 *       } catch {
 *         rejecter("INFERENCE_ERROR", error.localizedDescription, error)
 *       }
 *     }
 *   }
 *
 *   @objc
 *   func getMemoryUsage(_ resolver: @escaping RCTPromiseResolveBlock,
 *                       rejecter: @escaping RCTPromiseRejectBlock) {
 *     DispatchQueue.global(qos: .utility).async {
 *       let usedBytes = MLX.getMemoryUsage()  // MLX API
 *       let totalBytes = ProcessInfo.processInfo.physicalMemory
 *
 *       resolver([
 *         "usedBytes": usedBytes,
 *         "totalBytes": totalBytes
 *       ])
 *     }
 *   }
 *
 *   @objc
 *   func unloadModel(_ modelPath: String,
 *                    resolver: @escaping RCTPromiseResolveBlock,
 *                    rejecter: @escaping RCTPromiseRejectBlock) {
 *     self.model = nil
 *     self.modelPath = nil
 *     resolver([:])
 *   }
 *
 *   private func tokenize(_ text: String) -> [Int] {
 *     // Qwen3.5 tokenizer implementation
 *     // Use tiktoken or similar tokenizer
 *     return []  // Placeholder
 *   }
 *
 *   private func decode(_ tokens: [Int]) -> String {
 *     // Qwen3.5 decoder implementation
 *     return ""  // Placeholder
 *   }
 * }
 *
 * Android Implementation (Kotlin):
 * --------------------------------
 * File: android/app/src/main/java/com/laneshadow/MLXModelBridge.kt
 *
 * package com.laneshadow
 *
 * import com.facebook.react.bridge.*
 * import org.mlx.M LX  // MLX Android bindings
 *
 * class MLXModelBridge(reactContext: ReactApplicationContext) :
 *   ReactContextBaseJavaModule(reactContext) {
 *
 *   override fun getName(): String = "MLXModelBridge"
 *
 *   private var model: MLXModel? = null
 *
 *   @ReactMethod
 *   fun loadModel(modelPath: String, promise: Promise) {
 *     Thread {
 *       try {
 *         model = MLX.loadModel(modelPath)
 *         promise.resolve(Arguments.makeNativeMap(mapOf("success" to true)))
 *       } catch (e: Exception) {
 *         promise.reject("LOAD_ERROR", e.message, e)
 *       }
 *     }.start()
 *   }
 *
 *   @ReactMethod
 *   fun runInference(modelPath: String, input: String, promise: Promise) {
 *     val startTime = System.currentTimeMillis()
 *
 *     Thread {
 *       try {
 *         val result = model?.generate(input, maxTokens = 50) ?: ""
 *         val duration = System.currentTimeMillis() - startTime
 *
 *         val response = Arguments.makeNativeMap(mapOf(
 *           "result" to result,
 *           "durationMs" to duration
 *         ))
 *         promise.resolve(response)
 *       } catch (e: Exception) {
 *         promise.reject("INFERENCE_ERROR", e.message, e)
 *       }
 *     }.start()
 *   }
 *
 *   @ReactMethod
 *   fun getMemoryUsage(promise: Promise) {
 *     Thread {
 *       val usedBytes = MLX.getMemoryUsage()
 *       val totalBytes = Runtime.getRuntime().maxMemory()
 *
 *       val response = Arguments.makeNativeMap(mapOf(
 *         "usedBytes" to usedBytes,
 *         "totalBytes" to totalBytes
 *       ))
 *       promise.resolve(response)
 *     }.start()
 *   }
 *
 *   @ReactMethod
 *   fun unloadModel(modelPath: String, promise: Promise) {
 *     model = null
 *     promise.resolve(Arguments.makeNativeMap(mapOf()))
 *   }
 * }
 *
 * Package Registration:
 * --------------------
 * File: ios/MLXModelBridge.m
 *
 * #import <React/RCTBridgeModule.h>
 *
 * @interface RCT_EXTERN_MODULE(MLXModelBridge, NSObject)
 * RCT_EXTERN_METHOD(loadModel:(NSString *)modelPath
 *                   resolver:(RCTPromiseResolveBlock)resolve
 *                   rejecter:(RCTPromiseRejectBlock)reject)
 * RCT_EXTERN_METHOD(runInference:(NSString *)modelPath
 *                   input:(NSString *)input
 *                   resolver:(RCTPromiseResolveBlock)resolve
 *                   rejecter:(RCTPromiseRejectBlock)reject)
 * RCT_EXTERN_METHOD(getMemoryUsage:(RCTPromiseResolveBlock)resolve
 *                   rejecter:(RCTPromiseRejectBlock)reject)
 * RCT_EXTERN_METHOD(unloadModel:(NSString *)modelPath
 *                   resolver:(RCTPromiseResolveBlock)resolve
 *                   rejecter:(RCTPromiseRejectBlock)reject)
 * @end
 */

/**
 * TypeScript interface for the native module
 *
 * This defines the contract between JavaScript and native code.
 * The actual implementation lives in Swift (iOS) and Kotlin (Android).
 */
export interface MLXNativeModuleSpec {
  loadModel(modelPath: string): Promise<{ success: boolean; error?: string }>
  runInference(modelPath: string, input: string): Promise<{ result: string; durationMs: number }>
  getMemoryUsage(): Promise<{ usedBytes: number; totalBytes: number }>
  unloadModel(modelPath: string): Promise<void>
}

/**
 * MLX Model Configuration
 *
 * Configuration for Qwen3.5 0.8B model running on MLX.
 */
export interface MLXModelConfig {
  modelPath: string
  modelSize: number // Size in bytes
  maxTokens: number
  temperature: number
  topP: number
}

/**
 * Default configuration for Qwen3.5 0.8B
 */
export const DEFAULT_MLX_CONFIG: MLXModelConfig = {
  modelPath: '/models/qwen3.5-0.8b.mlxc',
  modelSize: 800 * 1024 * 1024, // 800MB
  maxTokens: 50,
  temperature: 0.7,
  topP: 0.9,
}
