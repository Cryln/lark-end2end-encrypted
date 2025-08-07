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

export interface UserAccessTokenResponse {
  code: number;
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  refresh_token_expires_in: number;
  scope: string;
  error: string | undefined;
  error_description: string | undefined;
}
export type UserInfoResponse = {
  code?: number | undefined;
  msg?: string | undefined;
  data?: {
    name?: string | undefined;
    en_name?: string | undefined;
    avatar_url?: string | undefined;
    avatar_thumb?: string | undefined;
    avatar_middle?: string | undefined;
    avatar_big?: string | undefined;
    open_id?: string | undefined;
    union_id?: string | undefined;
    email?: string | undefined;
    enterprise_email?: string | undefined;
    user_id?: string | undefined;
    mobile?: string | undefined;
    tenant_key?: string | undefined;
    employee_no?: string | undefined;
  } | undefined;
}