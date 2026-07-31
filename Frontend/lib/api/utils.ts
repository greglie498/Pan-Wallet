export function extractData<T>(response: any): T {
  return response.data?.data ?? response.data;
}