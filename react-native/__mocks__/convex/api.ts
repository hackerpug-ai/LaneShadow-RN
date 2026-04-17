const deepProxy = (): any =>
  new Proxy(
    {},
    {
      get: (_target, _prop) => deepProxy(),
    }
  )

export const api = deepProxy()
export const internal = deepProxy()
