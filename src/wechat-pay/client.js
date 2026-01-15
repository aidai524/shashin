/**
 * 微信支付 API 客户端
 */

import {
  rsaSign,
  generateNonceStr,
  generateTimestamp,
  aes256GcmDecrypt,
  buildSignMessage
} from './crypto.js';

const WECHAT_PAY_BASE_URL = 'https://api.mch.weixin.qq.com';

/**
 * 微信支付客户端类
 */
export class WechatPayClient {
  constructor(config) {
    this.mchid = config.mchid;
    this.privateKey = config.privateKey;
    this.serialNo = config.serialNo;
    this.apiV3Key = config.apiV3Key;
    this.appid = config.appid;
    this.notifyUrl = config.notifyUrl;
  }

  /**
   * 发起微信支付 API 请求
   * @param {string} method - HTTP 方法
   * @param {string} path - API 路径
   * @param {object} data - 请求数据
   * @returns {Promise<object>} 响应数据
   */
  async request(method, path, data = null) {
    const url = `${WECHAT_PAY_BASE_URL}${path}`;
    const timestamp = generateTimestamp();
    const nonceStr = generateNonceStr();
    const body = data ? JSON.stringify(data) : '';

    // 构建签名
    const signMessage = buildSignMessage(method, url, {}, data);
    const signature = await rsaSign(signMessage, this.privateKey);

    // 构建请求头
    const headers = {
      'Authorization': `WECHATPAY2-SHA256-RSA2048 mchid="${this.mchid}",nonce_str="${nonceStr}",timestamp="${timestamp}",serial_no="${this.serialNo}",signature="${signature}"`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: method === 'POST' ? body : null
      });

      const responseText = await response.text();

      if (!response.ok) {
        console.error('Wechat Pay API Error:', response.status, responseText);
        throw new Error(`微信支付 API 错误: ${response.status} ${responseText}`);
      }

      // 处理成功响应（可能包含加密的回调数据）
      return JSON.parse(responseText);
    } catch (error) {
      console.error('Wechat Pay Request Failed:', error);
      throw error;
    }
  }

  /**
   * Native 下单（扫码支付）
   * @param {object} orderData - 订单数据
   * @returns {Promise<object>} 下单结果
   */
  async nativePay(orderData) {
    const data = {
      appid: this.appid,
      mchid: this.mchid,
      description: orderData.description,
      out_trade_no: orderData.outTradeNo,
      notify_url: this.notifyUrl,
      amount: {
        total: orderData.total,
        currency: 'CNY'
      },
      scene_info: {
        payer_client_ip: orderData.clientIp || '127.0.0.1'
      }
    };

    return await this.request('POST', '/v3/pay/transactions/native', data);
  }

  /**
   * H5 下单（手机浏览器支付）
   * @param {object} orderData - 订单数据
   * @returns {Promise<object>} 下单结果
   */
  async h5Pay(orderData) {
    const data = {
      appid: this.appid,
      mchid: this.mchid,
      description: orderData.description,
      out_trade_no: orderData.outTradeNo,
      notify_url: this.notifyUrl,
      amount: {
        total: orderData.total,
        currency: 'CNY'
      },
      scene_info: {
        payer_client_ip: orderData.clientIp || '127.0.0.1',
        h5_info: {
          type: 'Wap'
        }
      }
    };

    return await this.request('POST', '/v3/pay/transactions/h5', data);
  }

  /**
   * JSAPI 下单（微信内支付）
   * @param {object} orderData - 订单数据
   * @returns {Promise<object>} 下单结果
   */
  async jsapiPay(orderData) {
    const data = {
      appid: this.appid,
      mchid: this.mchid,
      description: orderData.description,
      out_trade_no: orderData.outTradeNo,
      notify_url: this.notifyUrl,
      amount: {
        total: orderData.total,
        currency: 'CNY'
      },
      payer: {
        openid: orderData.openid
      }
    };

    return await this.request('POST', '/v3/pay/transactions/jsapi', data);
  }

  /**
   * 查询订单
   * @param {string} outTradeNo - 商户订单号
   * @returns {Promise<object>} 订单信息
   */
  async queryOrder(outTradeNo) {
    return await this.request('GET', `/v3/pay/transactions/out-trade-no/${outTradeNo}?mchid=${this.mchid}`);
  }

  /**
   * 关闭订单
   * @param {string} outTradeNo - 商户订单号
   * @returns {Promise<object>} 关闭结果
   */
  async closeOrder(outTradeNo) {
    return await this.request('POST', `/v3/pay/transactions/out-trade-no/${outTradeNo}/close`, {});
  }

  /**
   * 申请退款
   * @param {object} refundData - 退款数据
   * @returns {Promise<object>} 退款结果
   */
  async refund(refundData) {
    const data = {
      out_trade_no: refundData.outTradeNo,
      out_refund_no: refundData.outRefundNo,
      reason: refundData.reason || '用户申请退款',
      amount: {
        refund: refundData.refundAmount,
        total: refundData.totalAmount,
        currency: 'CNY'
      },
      notify_url: refundData.notifyUrl || this.notifyUrl
    };

    return await this.request('POST', '/v3/refund/domestic/refunds', data);
  }

  /**
   * 解密回调通知
   * @param {string} ciphertext - 加密的回调数据
   * @param {string} associatedData - 附加数据
   * @param {string} nonce - nonce
   * @returns {Promise<object>} 解密后的数据
   */
  async decryptCallback(ciphertext, associatedData, nonce) {
    const decrypted = await aes256GcmDecrypt(
      ciphertext,
      this.apiV3Key,
      nonce,
      associatedData
    );
    return JSON.parse(decrypted);
  }

  /**
   * 验证回调签名
   * @param {string} timestamp - 时间戳
   * @param {string} nonce - 随机字符串
   * @param {string} body - 请求体
   * @param {string} signature - 签名
   * @param {string} serialNo - 证书序列号
   * @returns {boolean} 是否验证通过
   */
  verifySignature(timestamp, nonce, body, signature, serialNo) {
    // TODO: 实现签名验证（需要获取微信平台证书）
    // 目前先返回 true，实际使用时需要验证
    console.log('Signature verification:', { timestamp, nonce, signature, serialNo });
    return true;
  }
}

/**
 * 创建微信支付客户端实例
 * @param {object} env - Cloudflare Workers 环境变量
 * @returns {WechatPayClient} 客户端实例
 */
export function createWechatPayClient(env) {
  return new WechatPayClient({
    mchid: env.WECHAT_PAY_MCHID,
    privateKey: env.WECHAT_PAY_PRIVATE_KEY,
    serialNo: env.WECHAT_PAY_CERT_SERIAL,
    apiV3Key: env.WECHAT_PAY_APIV3_KEY,
    appid: env.WECHAT_PAY_APPID,
    notifyUrl: env.WECHAT_PAY_NOTIFY_URL
  });
}
