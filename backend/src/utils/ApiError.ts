export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  static badRequest(message = "Noto'g'ri so'rov", details?: unknown) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = 'Avtorizatsiyadan o\'tilmagan') {
    return new ApiError(401, message);
  }

  static forbidden(message = "Ruxsat yo'q") {
    return new ApiError(403, message);
  }

  static notFound(message = 'Topilmadi') {
    return new ApiError(404, message);
  }

  static conflict(message = 'Ziddiyat yuzaga keldi') {
    return new ApiError(409, message);
  }

  static internal(message = 'Server xatoligi') {
    return new ApiError(500, message);
  }
}
