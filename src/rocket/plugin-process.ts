import {
  AbortError,
  RocketError
} from '../errors';
import type {
  AsyncHook,
  Plugin,
  RocketContext,
  SyncHook
} from '../plugin';
import { forEachIterable } from '../util';

export interface PluginItem<O = any> {
  option: O;
  plugin: Plugin<O>;
}

export function processAsyncHook<D>(
  plugins: PluginItem<any>[],
  getContext: () => RocketContext<any, any>,
  getHook: (plugin: Plugin<any>) => AsyncHook<any, D> | undefined,
  cancellerRef: (canceler?: () => void) => void,
  onSettle: (error: RocketError | null, data?: D) => boolean,
  onFinish: () => void
) {
  const runPlugin = (index: number): void => {
    if (index >= plugins.length) {
      return onFinish();
    }
    const {
      option,
      plugin
    } = plugins[index];
    const targetHook = getHook(plugin);
    if (targetHook === undefined) {
      return runPlugin(index + 1);
    }
    new Promise<D | undefined>((resolve, reject) => {
      let hookCanceller = targetHook.call(
        plugin,
        getContext(),
        option,
        (error?: RocketError | null, data?: D) => {
          if (error === undefined && data === undefined) {
            resolve(undefined);
          } else if (error !== null) {
            reject(error);
          } else {
            resolve(data);
          }
        }
      );
      if (hookCanceller === undefined) {
        hookCanceller = function defaultPluginCanceller() {
          reject(new AbortError());
        };
      }
      cancellerRef(hookCanceller);
    }).then(
      res => {
        cancellerRef(undefined);
        if (res === undefined || onSettle(null, res)) {
          runPlugin(index + 1);
        } else {
          onFinish();
        }
      },
      err => {
        cancellerRef(undefined);
        if (err instanceof RocketError) {
          if (onSettle(err)) {
            runPlugin(index + 1);
          } else {
            onFinish();
          }
        } else {
          throw err;
        }
      }
    );
    return undefined;
  };
  runPlugin(0);
}

export function processSyncHook(
  plugins: PluginItem<any>[],
  context: RocketContext,
  getHook: (plugin: Plugin<any>) => SyncHook<any> | undefined
) {
  forEachIterable(plugins, ({ plugin, option }) => {
    const hook = getHook(plugin);
    if (typeof hook === 'function') {
      hook.call(plugin, context, option);
    }
  });
}
