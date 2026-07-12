/* TỰ ĐỘNG SINH từ API_ENDPOINTS.md bằng `npm run docs:gen` — KHÔNG sửa tay. */
export const openapiDocument: Record<string, unknown> = {
  "openapi": "3.0.3",
  "info": {
    "title": "CloudMind API",
    "version": "1.0.0",
    "description": "API CloudMind — Node.js · MongoDB · Firebase · Gemini · PayOS.\n\nXác thực: gửi header `Authorization: Bearer <accessToken>`. Lấy token qua `POST /auth/login` hoặc `POST /auth/verify-email`."
  },
  "servers": [
    {
      "url": "/api/v1",
      "description": "Tương đối (cùng host)"
    },
    {
      "url": "http://localhost:4100/api/v1",
      "description": "Local dev"
    }
  ],
  "tags": [
    {
      "name": "Xác thực & Tài khoản"
    },
    {
      "name": "Hồ sơ & Cài đặt"
    },
    {
      "name": "Thư mục"
    },
    {
      "name": "Tệp tin & Lưu trữ (Firebase)"
    },
    {
      "name": "AI · Tìm kiếm ngữ nghĩa"
    },
    {
      "name": "AI · Hỏi đáp tài liệu (RAG)"
    },
    {
      "name": "AI · Tóm tắt"
    },
    {
      "name": "AI · Khai thác tri thức"
    },
    {
      "name": "AI · Gợi ý thư mục"
    },
    {
      "name": "Bảng điều khiển khách"
    },
    {
      "name": "Hoạt động & Thông báo"
    },
    {
      "name": "Gói cước & Thanh toán"
    },
    {
      "name": "Không gian làm việc nhóm (gói Team)"
    },
    {
      "name": "Admin · Tổng quan"
    },
    {
      "name": "Admin · Quản lý người dùng"
    },
    {
      "name": "Admin · Nội dung & Kiểm duyệt"
    },
    {
      "name": "Admin · Doanh thu & Giao dịch"
    },
    {
      "name": "Admin · Gói cước"
    },
    {
      "name": "Admin · Phân tích AI"
    },
    {
      "name": "Admin · Nhật ký hệ thống"
    },
    {
      "name": "Admin · Cài đặt hệ thống & Đội ngũ"
    },
    {
      "name": "Admin · Workspaces nhóm"
    },
    {
      "name": "Hỗ trợ (Tickets)"
    },
    {
      "name": "Hạ tầng & Webhooks"
    }
  ],
  "paths": {
    "/auth/register": {
      "post": {
        "tags": [
          "Xác thực & Tài khoản"
        ],
        "summary": "Đăng ký tài khoản khách hàng (email + mật khẩu)",
        "security": [],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          }
        },
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              },
              "example": {
                "email": "ban@email.com",
                "password": "MatKhau@123",
                "name": "Tên của bạn"
              }
            }
          }
        }
      }
    },
    "/auth/login": {
      "post": {
        "tags": [
          "Xác thực & Tài khoản"
        ],
        "summary": "Đăng nhập, trả access + refresh token",
        "security": [],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          }
        },
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              },
              "example": {
                "email": "ban@email.com",
                "password": "MatKhau@123"
              }
            }
          }
        }
      }
    },
    "/auth/google": {
      "post": {
        "tags": [
          "Xác thực & Tài khoản"
        ],
        "summary": "Đăng nhập Google qua Firebase Auth: body { idToken } (Firebase) → BE verify → tạo/khớp user → trả access + refresh token",
        "security": [],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          }
        },
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              },
              "example": {
                "idToken": "<firebase-id-token>"
              }
            }
          }
        }
      }
    },
    "/auth/refresh": {
      "post": {
        "tags": [
          "Xác thực & Tài khoản"
        ],
        "summary": "Làm mới access token từ refresh token",
        "security": [],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          }
        },
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/auth/logout": {
      "post": {
        "tags": [
          "Xác thực & Tài khoản"
        ],
        "summary": "Đăng xuất (thu hồi refresh token hiện tại)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/auth/logout-all": {
      "post": {
        "tags": [
          "Xác thực & Tài khoản"
        ],
        "summary": "Đăng xuất mọi thiết bị",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/auth/forgot-password": {
      "post": {
        "tags": [
          "Xác thực & Tài khoản"
        ],
        "summary": "Gửi email đặt lại mật khẩu",
        "security": [],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          }
        },
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              },
              "example": {
                "email": "ban@email.com"
              }
            }
          }
        }
      }
    },
    "/auth/reset-password": {
      "post": {
        "tags": [
          "Xác thực & Tài khoản"
        ],
        "summary": "Đặt lại mật khẩu bằng token",
        "security": [],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          }
        },
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              },
              "example": {
                "email": "ban@email.com",
                "code": "123456",
                "newPassword": "MatKhauMoi@123"
              }
            }
          }
        }
      }
    },
    "/auth/verify-email": {
      "post": {
        "tags": [
          "Xác thực & Tài khoản"
        ],
        "summary": "Xác thực email bằng token",
        "security": [],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          }
        },
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              },
              "example": {
                "email": "ban@email.com",
                "code": "123456"
              }
            }
          }
        }
      }
    },
    "/auth/me": {
      "get": {
        "tags": [
          "Xác thực & Tài khoản"
        ],
        "summary": "Lấy thông tin tài khoản (kèm workspace & wsRole nếu thuộc nhóm)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        }
      }
    },
    "/auth/change-password": {
      "post": {
        "tags": [
          "Xác thực & Tài khoản"
        ],
        "summary": "Đổi mật khẩu (cần mật khẩu cũ)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/me/profile": {
      "get": {
        "tags": [
          "Hồ sơ & Cài đặt"
        ],
        "summary": "Lấy hồ sơ (tên, handle, email, bio, avatar)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        }
      },
      "patch": {
        "tags": [
          "Hồ sơ & Cài đặt"
        ],
        "summary": "Cập nhật hồ sơ",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/me/avatar": {
      "post": {
        "tags": [
          "Hồ sơ & Cài đặt"
        ],
        "summary": "Tải/đổi ảnh đại diện (Firebase)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/me/settings": {
      "get": {
        "tags": [
          "Hồ sơ & Cài đặt"
        ],
        "summary": "Lấy toàn bộ cài đặt (AI, giao diện, bảo mật)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        }
      }
    },
    "/me/settings/ai": {
      "patch": {
        "tags": [
          "Hồ sơ & Cài đặt"
        ],
        "summary": "Cài đặt AI (tự tóm tắt, gợi ý thư mục, cho phép lập chỉ mục…)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/me/settings/appearance": {
      "patch": {
        "tags": [
          "Hồ sơ & Cài đặt"
        ],
        "summary": "Giao diện (theme, accent, giảm chuyển động)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/me/sessions": {
      "get": {
        "tags": [
          "Hồ sơ & Cài đặt"
        ],
        "summary": "Danh sách phiên đăng nhập (thiết bị, IP, vị trí)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        }
      }
    },
    "/me/sessions/{id}": {
      "delete": {
        "tags": [
          "Hồ sơ & Cài đặt"
        ],
        "summary": "Thu hồi 1 phiên",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ]
      }
    },
    "/me/2fa": {
      "post": {
        "tags": [
          "Hồ sơ & Cài đặt"
        ],
        "summary": "Bật/tắt & thiết lập 2FA (TOTP)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/me/account": {
      "delete": {
        "tags": [
          "Hồ sơ & Cài đặt"
        ],
        "summary": "Xoá tài khoản (xoá dữ liệu + file Firebase)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        }
      }
    },
    "/folders": {
      "get": {
        "tags": [
          "Thư mục"
        ],
        "summary": "Danh sách thư mục (?scope=personal|workspace, kèm số file, dung lượng)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        }
      },
      "post": {
        "tags": [
          "Thư mục"
        ],
        "summary": "Tạo thư mục (name, icon, tone, parentId, workspaceId?)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/folders/tree": {
      "get": {
        "tags": [
          "Thư mục"
        ],
        "summary": "Cây thư mục lồng nhau",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        }
      }
    },
    "/folders/{id}": {
      "get": {
        "tags": [
          "Thư mục"
        ],
        "summary": "Chi tiết thư mục + nội dung",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ]
      },
      "patch": {
        "tags": [
          "Thư mục"
        ],
        "summary": "Đổi tên / di chuyển / đổi màu",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      },
      "delete": {
        "tags": [
          "Thư mục"
        ],
        "summary": "Xoá thư mục (xử lý file con)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ]
      }
    },
    "/files/upload-url": {
      "post": {
        "tags": [
          "Tệp tin & Lưu trữ (Firebase)"
        ],
        "summary": "Tạo signed upload URL + bản ghi pending (kèm workspaceId?)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              },
              "example": {
                "fileName": "tai-lieu.pdf",
                "contentType": "application/pdf",
                "size": 12345
              }
            }
          }
        }
      }
    },
    "/files/{id}/confirm": {
      "post": {
        "tags": [
          "Tệp tin & Lưu trữ (Firebase)"
        ],
        "summary": "Xác nhận upload xong → kích hoạt AI pipeline + trừ quota",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/files/direct-upload": {
      "post": {
        "tags": [
          "Tệp tin & Lưu trữ (Firebase)"
        ],
        "summary": "Upload qua BE (multipart) cho file nhỏ",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/files": {
      "get": {
        "tags": [
          "Tệp tin & Lưu trữ (Firebase)"
        ],
        "summary": "Danh sách file (?scope=, lọc type/folder/starred, tìm, sắp xếp, phân trang)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        }
      }
    },
    "/files/{id}": {
      "get": {
        "tags": [
          "Tệp tin & Lưu trữ (Firebase)"
        ],
        "summary": "Chi tiết file (metadata, summary, tags)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ]
      },
      "patch": {
        "tags": [
          "Tệp tin & Lưu trữ (Firebase)"
        ],
        "summary": "Đổi tên / di chuyển folder / cập nhật tags",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      },
      "delete": {
        "tags": [
          "Tệp tin & Lưu trữ (Firebase)"
        ],
        "summary": "Chuyển vào thùng rác",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ]
      }
    },
    "/files/{id}/download": {
      "get": {
        "tags": [
          "Tệp tin & Lưu trữ (Firebase)"
        ],
        "summary": "Signed download URL (Firebase)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ]
      }
    },
    "/files/{id}/preview": {
      "get": {
        "tags": [
          "Tệp tin & Lưu trữ (Firebase)"
        ],
        "summary": "URL/thumbnail xem trước",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ]
      }
    },
    "/files/{id}/star": {
      "post": {
        "tags": [
          "Tệp tin & Lưu trữ (Firebase)"
        ],
        "summary": "Đánh dấu / bỏ đánh dấu sao",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/files/{id}/share": {
      "post": {
        "tags": [
          "Tệp tin & Lưu trữ (Firebase)"
        ],
        "summary": "Tạo link chia sẻ + quyền (view/edit, hết hạn)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/files/{id}/shares": {
      "get": {
        "tags": [
          "Tệp tin & Lưu trữ (Firebase)"
        ],
        "summary": "Danh sách link/người được chia sẻ",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ]
      }
    },
    "/files/{id}/share/{shareId}": {
      "delete": {
        "tags": [
          "Tệp tin & Lưu trữ (Firebase)"
        ],
        "summary": "Thu hồi chia sẻ",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "shareId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ]
      }
    },
    "/files/{id}/restore": {
      "post": {
        "tags": [
          "Tệp tin & Lưu trữ (Firebase)"
        ],
        "summary": "Khôi phục từ thùng rác",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/files/{id}/permanent": {
      "delete": {
        "tags": [
          "Tệp tin & Lưu trữ (Firebase)"
        ],
        "summary": "Xoá vĩnh viễn (xoá khỏi Firebase)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ]
      }
    },
    "/files/bulk": {
      "post": {
        "tags": [
          "Tệp tin & Lưu trữ (Firebase)"
        ],
        "summary": "Thao tác hàng loạt (move/delete/star nhiều file)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/ai/search": {
      "post": {
        "tags": [
          "AI · Tìm kiếm ngữ nghĩa"
        ],
        "summary": "Tìm theo ngữ nghĩa (mode: semantic/keyword/hybrid) → kết quả + độ liên quan + snippet",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              },
              "example": {
                "query": "kiến trúc RAG là gì",
                "mode": "semantic"
              }
            }
          }
        }
      }
    },
    "/ai/search/suggestions": {
      "get": {
        "tags": [
          "AI · Tìm kiếm ngữ nghĩa"
        ],
        "summary": "Gợi ý truy vấn / câu hỏi mẫu",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        }
      }
    },
    "/ai/reindex": {
      "post": {
        "tags": [
          "AI · Tìm kiếm ngữ nghĩa"
        ],
        "summary": "Tạo lại embedding cho file (sau khi sửa/migrate)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/ai/chat/conversations": {
      "get": {
        "tags": [
          "AI · Hỏi đáp tài liệu (RAG)"
        ],
        "summary": "Danh sách cuộc trò chuyện",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        }
      },
      "post": {
        "tags": [
          "AI · Hỏi đáp tài liệu (RAG)"
        ],
        "summary": "Tạo cuộc trò chuyện mới",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/ai/chat/conversations/{id}": {
      "get": {
        "tags": [
          "AI · Hỏi đáp tài liệu (RAG)"
        ],
        "summary": "Lịch sử tin nhắn 1 cuộc",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ]
      },
      "delete": {
        "tags": [
          "AI · Hỏi đáp tài liệu (RAG)"
        ],
        "summary": "Xoá cuộc trò chuyện",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ]
      }
    },
    "/ai/chat/conversations/{id}/messages": {
      "post": {
        "tags": [
          "AI · Hỏi đáp tài liệu (RAG)"
        ],
        "summary": "Gửi câu hỏi → trả lời kèm nguồn (RAG)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/ai/chat/conversations/{id}/stream": {
      "get": {
        "tags": [
          "AI · Hỏi đáp tài liệu (RAG)"
        ],
        "summary": "Stream câu trả lời (SSE)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ]
      }
    },
    "/ai/chat/messages/{id}/regenerate": {
      "post": {
        "tags": [
          "AI · Hỏi đáp tài liệu (RAG)"
        ],
        "summary": "Tạo lại câu trả lời",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/ai/summarize/{fileId}": {
      "post": {
        "tags": [
          "AI · Tóm tắt"
        ],
        "summary": "Tóm tắt file (length: short/medium/detailed)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "fileId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      },
      "get": {
        "tags": [
          "AI · Tóm tắt"
        ],
        "summary": "Lấy tóm tắt đã lưu + điểm chính + từ khoá",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "fileId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ]
      }
    },
    "/ai/summarize/{fileId}/regenerate": {
      "post": {
        "tags": [
          "AI · Tóm tắt"
        ],
        "summary": "Tạo lại tóm tắt theo độ dài khác",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "fileId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/ai/insights": {
      "get": {
        "tags": [
          "AI · Khai thác tri thức"
        ],
        "summary": "Các thẻ insight (chủ đề nổi bật, file cần dọn…)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        }
      }
    },
    "/ai/insights/clusters": {
      "get": {
        "tags": [
          "AI · Khai thác tri thức"
        ],
        "summary": "Cụm tri thức (knowledge graph: node + cạnh)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        }
      }
    },
    "/ai/insights/connections": {
      "get": {
        "tags": [
          "AI · Khai thác tri thức"
        ],
        "summary": "Kết nối giữa các tài liệu AI phát hiện",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        }
      }
    },
    "/ai/insights/trends": {
      "get": {
        "tags": [
          "AI · Khai thác tri thức"
        ],
        "summary": "Xu hướng chủ đề theo thời gian",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        }
      }
    },
    "/ai/suggest-folder": {
      "post": {
        "tags": [
          "AI · Gợi ý thư mục"
        ],
        "summary": "Phân tích file → gợi ý thư mục phù hợp + độ tin cậy + lý do",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/dashboard/stats": {
      "get": {
        "tags": [
          "Bảng điều khiển khách"
        ],
        "summary": "Thống kê (dung lượng, tổng file, lượt AI, cụm tri thức)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        }
      }
    },
    "/dashboard/storage-breakdown": {
      "get": {
        "tags": [
          "Bảng điều khiển khách"
        ],
        "summary": "Phân bổ dung lượng theo loại",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        }
      }
    },
    "/dashboard/activity-chart": {
      "get": {
        "tags": [
          "Bảng điều khiển khách"
        ],
        "summary": "Hoạt động upload/AI theo tuần",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        }
      }
    },
    "/activity": {
      "get": {
        "tags": [
          "Hoạt động & Thông báo"
        ],
        "summary": "Dòng hoạt động gần đây",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        }
      }
    },
    "/notifications": {
      "get": {
        "tags": [
          "Hoạt động & Thông báo"
        ],
        "summary": "Danh sách thông báo (gồm lời mời vào workspace)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        }
      }
    },
    "/notifications/{id}/read": {
      "post": {
        "tags": [
          "Hoạt động & Thông báo"
        ],
        "summary": "Đánh dấu đã đọc",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/notifications/read-all": {
      "post": {
        "tags": [
          "Hoạt động & Thông báo"
        ],
        "summary": "Đánh dấu đã đọc tất cả",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/plans": {
      "get": {
        "tags": [
          "Gói cước & Thanh toán"
        ],
        "summary": "Danh sách gói công khai (Free/Pro/Team)",
        "security": [],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          }
        }
      }
    },
    "/subscription": {
      "get": {
        "tags": [
          "Gói cước & Thanh toán"
        ],
        "summary": "Gói hiện tại + chu kỳ + hạn dùng + seats (nếu Team)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        }
      }
    },
    "/subscription/checkout": {
      "post": {
        "tags": [
          "Gói cước & Thanh toán"
        ],
        "summary": "Tạo phiên thanh toán (nâng cấp/đổi gói; body có seats cho Team)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              },
              "example": {
                "planKey": "pro",
                "seats": 1,
                "months": 1
              }
            }
          }
        }
      }
    },
    "/subscription/cancel": {
      "post": {
        "tags": [
          "Gói cước & Thanh toán"
        ],
        "summary": "Huỷ gia hạn",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/billing/invoices": {
      "get": {
        "tags": [
          "Gói cước & Thanh toán"
        ],
        "summary": "Lịch sử hoá đơn (phản ánh số seat)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        }
      }
    },
    "/billing/invoices/{id}": {
      "get": {
        "tags": [
          "Gói cước & Thanh toán"
        ],
        "summary": "Chi tiết hoá đơn",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ]
      }
    },
    "/subscription/sync/{orderCode}": {
      "post": {
        "tags": [
          "Gói cước & Thanh toán"
        ],
        "summary": "Đồng bộ trạng thái đơn từ PayOS (không cần webhook)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "orderCode",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/subscription/checkout/{orderCode}/cancel": {
      "post": {
        "tags": [
          "Gói cước & Thanh toán"
        ],
        "summary": "Huỷ link thanh toán đang chờ",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "orderCode",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/workspaces": {
      "post": {
        "tags": [
          "Không gian làm việc nhóm (gói Team)"
        ],
        "summary": "Tạo workspace (tự động khi đăng ký gói Team)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/workspaces/current": {
      "get": {
        "tags": [
          "Không gian làm việc nhóm (gói Team)"
        ],
        "summary": "Lấy workspace hiện tại của tôi (tên, logo, quota, seats)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        }
      },
      "patch": {
        "tags": [
          "Không gian làm việc nhóm (gói Team)"
        ],
        "summary": "Cập nhật (tên, logo, slug)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      },
      "delete": {
        "tags": [
          "Không gian làm việc nhóm (gói Team)"
        ],
        "summary": "Giải tán workspace (hạ về gói cá nhân)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        }
      }
    },
    "/workspaces/current/transfer": {
      "post": {
        "tags": [
          "Không gian làm việc nhóm (gói Team)"
        ],
        "summary": "Chuyển quyền sở hữu cho thành viên khác",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/workspaces/current/members": {
      "get": {
        "tags": [
          "Không gian làm việc nhóm (gói Team)"
        ],
        "summary": "Danh sách thành viên + vai trò + dung lượng dùng",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        }
      }
    },
    "/workspaces/current/members/{id}/role": {
      "patch": {
        "tags": [
          "Không gian làm việc nhóm (gói Team)"
        ],
        "summary": "Đổi vai trò thành viên",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/workspaces/current/members/{id}": {
      "delete": {
        "tags": [
          "Không gian làm việc nhóm (gói Team)"
        ],
        "summary": "Gỡ thành viên khỏi nhóm",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ]
      }
    },
    "/workspaces/current/leave": {
      "post": {
        "tags": [
          "Không gian làm việc nhóm (gói Team)"
        ],
        "summary": "Tự rời workspace",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/workspaces/current/invites": {
      "post": {
        "tags": [
          "Không gian làm việc nhóm (gói Team)"
        ],
        "summary": "Mời qua email (tiêu tốn 1 seat khi chấp nhận)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      },
      "get": {
        "tags": [
          "Không gian làm việc nhóm (gói Team)"
        ],
        "summary": "Lời mời đang chờ",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        }
      }
    },
    "/workspaces/current/invites/{id}/resend": {
      "post": {
        "tags": [
          "Không gian làm việc nhóm (gói Team)"
        ],
        "summary": "Gửi lại lời mời",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/workspaces/current/invites/{id}": {
      "delete": {
        "tags": [
          "Không gian làm việc nhóm (gói Team)"
        ],
        "summary": "Thu hồi lời mời",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ]
      }
    },
    "/invites/{token}": {
      "get": {
        "tags": [
          "Không gian làm việc nhóm (gói Team)"
        ],
        "summary": "Xem chi tiết lời mời (tên nhóm, người mời)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "token",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ]
      }
    },
    "/invites/{token}/accept": {
      "post": {
        "tags": [
          "Không gian làm việc nhóm (gói Team)"
        ],
        "summary": "Chấp nhận → gia nhập workspace",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "token",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/invites/{token}/decline": {
      "post": {
        "tags": [
          "Không gian làm việc nhóm (gói Team)"
        ],
        "summary": "Từ chối lời mời",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "token",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/workspaces/current/seats": {
      "get": {
        "tags": [
          "Không gian làm việc nhóm (gói Team)"
        ],
        "summary": "Số seat đã dùng / đã mua",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        }
      },
      "post": {
        "tags": [
          "Không gian làm việc nhóm (gói Team)"
        ],
        "summary": "Đổi số seat: tăng → trả link thanh toán PayOS (prorated theo ngày còn lại của kỳ), giảm → áp dụng ngay",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/workspaces/current/shared": {
      "get": {
        "tags": [
          "Không gian làm việc nhóm (gói Team)"
        ],
        "summary": "Thư mục/tệp được chia sẻ trong nhóm",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        }
      }
    },
    "/workspaces/current/folders/{id}/attach": {
      "post": {
        "tags": [
          "Không gian làm việc nhóm (gói Team)"
        ],
        "summary": "Đưa thư mục cá nhân (kèm thư mục con + file) vào nhóm",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/workspaces/current/folders/{id}/detach": {
      "post": {
        "tags": [
          "Không gian làm việc nhóm (gói Team)"
        ],
        "summary": "Gỡ thư mục khỏi nhóm, trả về cá nhân",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/workspaces/current/folders/{id}/permissions": {
      "patch": {
        "tags": [
          "Không gian làm việc nhóm (gói Team)"
        ],
        "summary": "Phân quyền folder cho thành viên (view/edit)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/workspaces/current/activity": {
      "get": {
        "tags": [
          "Không gian làm việc nhóm (gói Team)"
        ],
        "summary": "Nhật ký hoạt động nhóm (tính năng Team)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        }
      }
    },
    "/admin/overview/kpis": {
      "get": {
        "tags": [
          "Admin · Tổng quan"
        ],
        "summary": "KPI (tổng user, MRR, dung lượng, lượt AI, churn, user mới)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        }
      }
    },
    "/admin/overview/revenue": {
      "get": {
        "tags": [
          "Admin · Tổng quan"
        ],
        "summary": "Doanh thu & người dùng mới theo tháng",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        }
      }
    },
    "/admin/overview/user-growth": {
      "get": {
        "tags": [
          "Admin · Tổng quan"
        ],
        "summary": "Tăng trưởng người dùng tích luỹ",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        }
      }
    },
    "/admin/overview/plan-distribution": {
      "get": {
        "tags": [
          "Admin · Tổng quan"
        ],
        "summary": "Phân bổ theo gói",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        }
      }
    },
    "/admin/overview/system-health": {
      "get": {
        "tags": [
          "Admin · Tổng quan"
        ],
        "summary": "Tình trạng dịch vụ (API/AI/Storage/Payment)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        }
      }
    },
    "/admin/overview/recent": {
      "get": {
        "tags": [
          "Admin · Tổng quan"
        ],
        "summary": "Người dùng mới + giao dịch gần đây",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        }
      }
    },
    "/admin/users": {
      "get": {
        "tags": [
          "Admin · Quản lý người dùng"
        ],
        "summary": "Danh sách (lọc gói/trạng thái/workspace, tìm, phân trang)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        }
      },
      "post": {
        "tags": [
          "Admin · Quản lý người dùng"
        ],
        "summary": "Tạo người dùng",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        },
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/admin/users/{id}": {
      "get": {
        "tags": [
          "Admin · Quản lý người dùng"
        ],
        "summary": "Chi tiết người dùng (kèm workspace & vai trò nếu có)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ]
      },
      "patch": {
        "tags": [
          "Admin · Quản lý người dùng"
        ],
        "summary": "Cập nhật thông tin",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      },
      "delete": {
        "tags": [
          "Admin · Quản lý người dùng"
        ],
        "summary": "Xoá người dùng (kèm dữ liệu)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ]
      }
    },
    "/admin/users/{id}/plan": {
      "patch": {
        "tags": [
          "Admin · Quản lý người dùng"
        ],
        "summary": "Đổi gói cho người dùng",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/admin/users/{id}/suspend": {
      "post": {
        "tags": [
          "Admin · Quản lý người dùng"
        ],
        "summary": "Tạm khoá tài khoản",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/admin/users/{id}/unsuspend": {
      "post": {
        "tags": [
          "Admin · Quản lý người dùng"
        ],
        "summary": "Mở khoá",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/admin/users/{id}/reset-password": {
      "post": {
        "tags": [
          "Admin · Quản lý người dùng"
        ],
        "summary": "Gửi/đặt lại mật khẩu",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/admin/users/{id}/impersonate": {
      "post": {
        "tags": [
          "Admin · Quản lý người dùng"
        ],
        "summary": "Đăng nhập thay (token tạm)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/admin/users/{id}/files": {
      "get": {
        "tags": [
          "Admin · Quản lý người dùng"
        ],
        "summary": "File của người dùng",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ]
      }
    },
    "/admin/users/{id}/transactions": {
      "get": {
        "tags": [
          "Admin · Quản lý người dùng"
        ],
        "summary": "Lịch sử thanh toán của người dùng",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ]
      }
    },
    "/admin/content": {
      "get": {
        "tags": [
          "Admin · Nội dung & Kiểm duyệt"
        ],
        "summary": "Danh sách file toàn hệ (lọc trạng thái: clean/flagged/reviewing/removed)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        }
      }
    },
    "/admin/content/queue": {
      "get": {
        "tags": [
          "Admin · Nội dung & Kiểm duyệt"
        ],
        "summary": "Hàng đợi cần kiểm duyệt (flagged + reviewing)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        }
      }
    },
    "/admin/content/{id}": {
      "get": {
        "tags": [
          "Admin · Nội dung & Kiểm duyệt"
        ],
        "summary": "Chi tiết file + lý do + báo cáo",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ]
      }
    },
    "/admin/content/{id}/approve": {
      "post": {
        "tags": [
          "Admin · Nội dung & Kiểm duyệt"
        ],
        "summary": "Duyệt (đánh dấu sạch)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/admin/content/{id}/remove": {
      "post": {
        "tags": [
          "Admin · Nội dung & Kiểm duyệt"
        ],
        "summary": "Gỡ nội dung vi phạm",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/admin/reports": {
      "get": {
        "tags": [
          "Admin · Nội dung & Kiểm duyệt"
        ],
        "summary": "Danh sách báo cáo vi phạm",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        }
      }
    },
    "/admin/reports/{id}/resolve": {
      "post": {
        "tags": [
          "Admin · Nội dung & Kiểm duyệt"
        ],
        "summary": "Xử lý báo cáo",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/admin/billing/metrics": {
      "get": {
        "tags": [
          "Admin · Doanh thu & Giao dịch"
        ],
        "summary": "MRR/ARR, doanh thu theo gói, churn (tách seat của Team)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        }
      }
    },
    "/admin/billing/transactions": {
      "get": {
        "tags": [
          "Admin · Doanh thu & Giao dịch"
        ],
        "summary": "Danh sách giao dịch (lọc trạng thái)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        }
      }
    },
    "/admin/billing/transactions/{id}": {
      "get": {
        "tags": [
          "Admin · Doanh thu & Giao dịch"
        ],
        "summary": "Chi tiết giao dịch",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ]
      }
    },
    "/admin/billing/transactions/{id}/refund": {
      "post": {
        "tags": [
          "Admin · Doanh thu & Giao dịch"
        ],
        "summary": "Tạo hoàn tiền",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/admin/billing/failed": {
      "get": {
        "tags": [
          "Admin · Doanh thu & Giao dịch"
        ],
        "summary": "Giao dịch thất bại cần xử lý",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        }
      }
    },
    "/admin/billing/invoices": {
      "get": {
        "tags": [
          "Admin · Doanh thu & Giao dịch"
        ],
        "summary": "Toàn bộ hoá đơn (xuất CSV)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        }
      }
    },
    "/admin/plans": {
      "get": {
        "tags": [
          "Admin · Gói cước"
        ],
        "summary": "Danh sách gói + subscribers + MRR",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        }
      },
      "post": {
        "tags": [
          "Admin · Gói cước"
        ],
        "summary": "Tạo gói mới (hỗ trợ giá theo seat)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        },
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/admin/plans/{id}": {
      "get": {
        "tags": [
          "Admin · Gói cước"
        ],
        "summary": "Chi tiết gói",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ]
      },
      "patch": {
        "tags": [
          "Admin · Gói cước"
        ],
        "summary": "Cập nhật giá/tính năng/dung lượng/seat",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      },
      "delete": {
        "tags": [
          "Admin · Gói cước"
        ],
        "summary": "Xoá/ẩn gói",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ]
      }
    },
    "/admin/plans/{id}/toggle": {
      "post": {
        "tags": [
          "Admin · Gói cước"
        ],
        "summary": "Bật/tắt gói",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/admin/plans/{id}/subscribers": {
      "get": {
        "tags": [
          "Admin · Gói cước"
        ],
        "summary": "Người đăng ký gói",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ]
      }
    },
    "/admin/ai/metrics": {
      "get": {
        "tags": [
          "Admin · Phân tích AI"
        ],
        "summary": "Tổng lượt, chi phí mô hình, độ trễ TB, độ chính xác",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        }
      }
    },
    "/admin/ai/by-feature": {
      "get": {
        "tags": [
          "Admin · Phân tích AI"
        ],
        "summary": "Lượt dùng theo tính năng",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        }
      }
    },
    "/admin/ai/daily-trend": {
      "get": {
        "tags": [
          "Admin · Phân tích AI"
        ],
        "summary": "Xu hướng lượt AI theo ngày",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        }
      }
    },
    "/admin/ai/top-queries": {
      "get": {
        "tags": [
          "Admin · Phân tích AI"
        ],
        "summary": "Truy vấn phổ biến",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        }
      }
    },
    "/admin/ai/cost": {
      "get": {
        "tags": [
          "Admin · Phân tích AI"
        ],
        "summary": "Phân tích chi phí token theo thời gian",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        }
      }
    },
    "/admin/audit": {
      "get": {
        "tags": [
          "Admin · Nhật ký hệ thống"
        ],
        "summary": "Danh sách nhật ký (lọc mức độ, tìm, phân trang)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        }
      }
    },
    "/admin/audit/{id}": {
      "get": {
        "tags": [
          "Admin · Nhật ký hệ thống"
        ],
        "summary": "Chi tiết một sự kiện",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ]
      }
    },
    "/admin/audit/export": {
      "get": {
        "tags": [
          "Admin · Nhật ký hệ thống"
        ],
        "summary": "Xuất nhật ký (CSV/JSON)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        }
      }
    },
    "/admin/settings": {
      "get": {
        "tags": [
          "Admin · Cài đặt hệ thống & Đội ngũ"
        ],
        "summary": "Lấy toàn bộ cấu hình hệ thống",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        }
      }
    },
    "/admin/settings/general": {
      "patch": {
        "tags": [
          "Admin · Cài đặt hệ thống & Đội ngũ"
        ],
        "summary": "Chung (tên app, email hỗ trợ, ngôn ngữ, bảo trì)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        },
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/admin/settings/ai": {
      "patch": {
        "tags": [
          "Admin · Cài đặt hệ thống & Đội ngũ"
        ],
        "summary": "Cấu hình AI (model, bật/tắt tính năng, hạn mức)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        },
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/admin/settings/limits": {
      "patch": {
        "tags": [
          "Admin · Cài đặt hệ thống & Đội ngũ"
        ],
        "summary": "Giới hạn (kích thước file, dung lượng/gói, rate limit)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        },
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/admin/settings/security": {
      "patch": {
        "tags": [
          "Admin · Cài đặt hệ thống & Đội ngũ"
        ],
        "summary": "Bảo mật (bắt buộc 2FA, session timeout, IP allowlist)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        },
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/admin/team": {
      "get": {
        "tags": [
          "Admin · Cài đặt hệ thống & Đội ngũ"
        ],
        "summary": "Danh sách thành viên quản trị (nhân sự nội bộ)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        }
      }
    },
    "/admin/team/invite": {
      "post": {
        "tags": [
          "Admin · Cài đặt hệ thống & Đội ngũ"
        ],
        "summary": "Mời thành viên admin (gửi email)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        },
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/admin/team/{id}/role": {
      "patch": {
        "tags": [
          "Admin · Cài đặt hệ thống & Đội ngũ"
        ],
        "summary": "Đổi vai trò admin (Owner/Admin/Moderator/Support)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/admin/team/{id}": {
      "delete": {
        "tags": [
          "Admin · Cài đặt hệ thống & Đội ngũ"
        ],
        "summary": "Gỡ thành viên admin",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ]
      }
    },
    "/admin/integrations": {
      "get": {
        "tags": [
          "Admin · Cài đặt hệ thống & Đội ngũ"
        ],
        "summary": "Trạng thái tích hợp (Stripe/MoMo/Slack/Google)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        }
      }
    },
    "/admin/integrations/{key}": {
      "patch": {
        "tags": [
          "Admin · Cài đặt hệ thống & Đội ngũ"
        ],
        "summary": "Bật/tắt & cấu hình tích hợp",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "key",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/admin/workspaces": {
      "get": {
        "tags": [
          "Admin · Workspaces nhóm"
        ],
        "summary": "Danh sách workspace (tên, owner, seats, dung lượng, gói)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        }
      }
    },
    "/admin/workspaces/{id}": {
      "get": {
        "tags": [
          "Admin · Workspaces nhóm"
        ],
        "summary": "Chi tiết workspace + thành viên",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ]
      }
    },
    "/admin/workspaces/{id}/members": {
      "get": {
        "tags": [
          "Admin · Workspaces nhóm"
        ],
        "summary": "Thành viên của workspace",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ]
      }
    },
    "/admin/workspaces/{id}/suspend": {
      "post": {
        "tags": [
          "Admin · Workspaces nhóm"
        ],
        "summary": "Tạm ngưng workspace (vi phạm/quá hạn)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/admin/workspaces/{id}/seats": {
      "patch": {
        "tags": [
          "Admin · Workspaces nhóm"
        ],
        "summary": "Điều chỉnh seat thủ công (hỗ trợ/đối soát)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/tickets": {
      "post": {
        "tags": [
          "Hỗ trợ (Tickets)"
        ],
        "summary": "Tạo yêu cầu hỗ trợ",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      },
      "get": {
        "tags": [
          "Hỗ trợ (Tickets)"
        ],
        "summary": "Danh sách ticket của tôi",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        }
      }
    },
    "/tickets/{id}": {
      "get": {
        "tags": [
          "Hỗ trợ (Tickets)"
        ],
        "summary": "Chi tiết + hội thoại",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ]
      }
    },
    "/tickets/{id}/reply": {
      "post": {
        "tags": [
          "Hỗ trợ (Tickets)"
        ],
        "summary": "Trả lời ticket",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/admin/tickets": {
      "get": {
        "tags": [
          "Hỗ trợ (Tickets)"
        ],
        "summary": "Toàn bộ ticket (lọc trạng thái/ưu tiên)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        }
      }
    },
    "/admin/tickets/{id}/assign": {
      "post": {
        "tags": [
          "Hỗ trợ (Tickets)"
        ],
        "summary": "Phân công xử lý",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/admin/tickets/{id}/reply": {
      "post": {
        "tags": [
          "Hỗ trợ (Tickets)"
        ],
        "summary": "Phản hồi khách",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/admin/tickets/{id}/close": {
      "post": {
        "tags": [
          "Hỗ trợ (Tickets)"
        ],
        "summary": "Đóng ticket",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          },
          "403": {
            "$ref": "#/components/responses/Error"
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/health": {
      "get": {
        "tags": [
          "Hạ tầng & Webhooks"
        ],
        "summary": "Health check (DB/Firebase/Gemini)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        }
      }
    },
    "/config": {
      "get": {
        "tags": [
          "Hạ tầng & Webhooks"
        ],
        "summary": "Cấu hình công khai cho client (feature flags, limits)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        }
      }
    },
    "/webhooks/payment": {
      "post": {
        "tags": [
          "Hạ tầng & Webhooks"
        ],
        "summary": "Webhook PayOS (verify chữ ký) → cập nhật transactions/subscriptions (gồm thay đổi seat Team)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    },
    "/webhooks/ai-job": {
      "post": {
        "tags": [
          "Hạ tầng & Webhooks"
        ],
        "summary": "(tuỳ chọn) callback job AI chạy nền hoàn tất",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Thành công",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Success"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/Error"
          },
          "401": {
            "$ref": "#/components/responses/Error"
          }
        },
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "securitySchemes": {
      "bearerAuth": {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT"
      }
    },
    "schemas": {
      "Success": {
        "type": "object",
        "properties": {
          "success": {
            "type": "boolean",
            "example": true
          },
          "data": {},
          "meta": {
            "type": "object",
            "nullable": true,
            "properties": {
              "page": {
                "type": "integer"
              },
              "limit": {
                "type": "integer"
              },
              "total": {
                "type": "integer"
              }
            }
          }
        },
        "required": [
          "success"
        ]
      },
      "Error": {
        "type": "object",
        "properties": {
          "success": {
            "type": "boolean",
            "example": false
          },
          "error": {
            "type": "object",
            "properties": {
              "code": {
                "type": "string"
              },
              "message": {
                "type": "string"
              },
              "details": {}
            }
          }
        },
        "required": [
          "success",
          "error"
        ]
      }
    },
    "responses": {
      "Error": {
        "description": "Lỗi",
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/Error"
            }
          }
        }
      }
    }
  }
}
