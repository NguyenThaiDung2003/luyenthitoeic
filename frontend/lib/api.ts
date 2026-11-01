export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

const NETWORK_ERROR = "Không kết nối được máy chủ. Vui lòng thử lại.";

// Mọi lời gọi đều qua /api cùng nguồn nên cookie đăng nhập được gửi tự động
export async function api<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method: init?.method ?? "GET",
      headers: init?.body === undefined ? undefined : { "Content-Type": "application/json" },
      body: init?.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch {
    throw new ApiError(0, NETWORK_ERROR);
  }

  if (response.status === 204) return undefined as T;

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = Array.isArray(data?.message) ? data.message[0] : data?.message;
    throw new ApiError(response.status, message ?? "Đã có lỗi xảy ra. Vui lòng thử lại.");
  }
  return data as T;
}
