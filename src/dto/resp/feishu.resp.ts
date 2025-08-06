/**
 * 飞书API响应类型定义
 */

export interface TenantAccessTokenResponse {
  code: number;
  msg: string;
  tenant_access_token: string;
  expire: number;
}

export interface JsapiTicketResponse {
  code: number;
  msg: string;
  data: {
    ticket: string;
    expire_in: number;
  };
}