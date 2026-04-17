/**
 * Ambient module declaration for react-test-renderer.
 *
 * react-test-renderer@19.x does not ship bundled TypeScript declarations and
 * @types/react-test-renderer is not installed.  This shim satisfies the
 * compiler so tests can:
 *   - import renderer, { act } from 'react-test-renderer'  (values)
 *   - use renderer.ReactTestRenderer as a type             (namespace)
 */
declare module 'react-test-renderer' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type AnyComponent = string | ((...args: any[]) => any) | { new (...args: any[]): any }

  namespace renderer {
    interface ReactTestInstance {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: AnyComponent
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      props: Record<string, any>
      parent: ReactTestInstance | null
      children: Array<ReactTestInstance | string>
      findAll(predicate: (node: ReactTestInstance) => boolean): ReactTestInstance[]
      findAllByType(type: AnyComponent): ReactTestInstance[]
      findByType(type: AnyComponent): ReactTestInstance
      findByProps(props: Record<string, unknown>): ReactTestInstance
      findAllByProps(props: Record<string, unknown>): ReactTestInstance[]
    }

    interface ReactTestRendererJSON {
      type: string
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      props: Record<string, any>
      children: Array<ReactTestRendererJSON | string> | null
    }

    interface ReactTestRenderer {
      root: ReactTestInstance
      toJSON(): ReactTestRendererJSON | ReactTestRendererJSON[] | null
      unmount(): void
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      update(element: any): void
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function create(
      element: any,
      options?: { createNodeMock?: (element: any) => unknown },
    ): ReactTestRenderer

    function act(callback: () => void | Promise<void>): Promise<void>
  }

  export = renderer
}
