import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import httpAdapter from "axios/lib/adapters/http";

const batchInterval = 2000; // two seconds
let batchedRequests: AxiosRequestConfig[] = [];
let batchedRequestPromise: Promise<any> | null = null;

const getBatchedRequestsConfig = (
  config: AxiosRequestConfig
): AxiosRequestConfig => {
  if (batchedRequests.length === 0) {
    return config;
  }

  const batchConfig = {
    ...config,
    params: {
      ids: [...new Set(batchedRequests.flatMap((req) => req.params.ids))],
    },
  };

  return batchConfig;
};

const batchRequest = (config: AxiosRequestConfig): Promise<any> => {
  batchedRequests.push(config);

  if (batchedRequestPromise === null) {
    batchedRequestPromise = new Promise((resolve, reject) => {
      setTimeout(() => {
        httpAdapter(getBatchedRequestsConfig(config))
          .then(resolve)
          .catch(reject)
          .finally(() => (batchedRequests = []));
      }, batchInterval);
    });
  }

  return batchedRequestPromise;
};

const batchInterceptor = (instance: AxiosInstance, url: string): void => {
  instance.interceptors.request.use(
    (request) => {
      request.adapter = (config) =>
        batchRequest(config).then(getResolver(config));

      return request;
    },
    (error) => Promise.reject(error)
  );
};

const getResolver = (config: AxiosRequestConfig) => {
  return (res: AxiosResponse) => {
    return Promise.resolve({ ...res, data: {} });
  };
};

export default batchInterceptor;
