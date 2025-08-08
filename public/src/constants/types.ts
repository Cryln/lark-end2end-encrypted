// 算法配置类型定义
export type AlgorithmConfig = {
  name: string;
  supported: boolean;
  description: string;
};

export type SupportedAlgorithmConfig = AlgorithmConfig & {
  generateOptions: {
    name: string;
    [key: string]: any;
  };
};

export class ChatContext {
  openChatId: string;
  myOpenId?: string;
  friendOpenId?: string;
  triggerMessage?: LarkMessage;
  sessionId?: string;
  symmetricKey?: string;

  constructor() {
    this.openChatId = '';
  }
  setOpenChatId(openChatId: string) {
    this.openChatId = openChatId;
  }
  setMyOpenId(myOpenId?: string) {
    this.myOpenId = myOpenId;
  }
  setFriendOpenId(friendOpenId?: string) {
    this.friendOpenId = friendOpenId;
  }
  setTriggerMessage(triggerMessage?: LarkMessage) {
    this.triggerMessage = triggerMessage;
  }
  setSessionId(sessionId?: string) {
    this.sessionId = sessionId;
  }
  setSymmetricKey(symmetricKey?: string) {
    this.symmetricKey = symmetricKey;
  }
}

export type ChatMessage = {
  messageType: '普通消息' | '新会话' | '回信';
  sessionId: string
  content: string;
  sender: MessageSender;
}

// 消息发送者类型
export type MessageSender = {
  name: string;
  open_id: string;
};

// 消息内容类型 - 文本消息
export type TextMessageContent = {
  text: string;
};

// 消息内容类型 - 交互式消息中的文本元素
export type InteractiveTextElement = {
  tag: 'text';
  text: string;
};

// 消息内容类型 - 交互式消息中的图片元素
export type InteractiveImageElement = {
  tag: 'img';
  image_key: string;
};

// 消息内容类型 - 交互式消息中的链接元素
export type InteractiveLinkElement = {
  tag: 'a';
  href: string;
  text: string;
};

// 消息内容类型 - 交互式消息中的分隔线元素
export type InteractiveHrElement = {
  tag: 'hr';
};

// 消息内容类型 - 交互式消息中的注释元素
export type InteractiveNoteElement = {
  tag: 'note';
  elements: (InteractiveImageElement | InteractiveLinkElement)[];
};

// 消息内容类型 - 交互式消息
export type InteractiveMessageContent = {
  title: string;
  elements: (InteractiveTextElement[] | InteractiveHrElement[] | InteractiveNoteElement[])[];
};

export function getChatMessage(msg?: LarkMessage): (ChatMessage | undefined) {
  if (!msg) {
    return undefined;
  }
  const content = getMessageContent(msg);
  if (!content) {
    return undefined;
  } else {
    let chatMessage: ChatMessage = {
      messageType: '普通消息',
      content: '',
      sessionId: '',
      sender: msg.sender
    }

    if ('text' in content) {
      chatMessage.content = content.text;
    } else if ('title' in content && 'elements' in content) {
      chatMessage.messageType = '回信';
      const msgType = content.title.split('#')[0]
      if (msgType === '新会话') {
        chatMessage.messageType = '新会话'
      }
      const sessionId = content.title.split('#')[1]
      chatMessage.sessionId = sessionId
      let text = ''
      content.elements.forEach((item) => {
        item.forEach((it) => {
          if (it.tag === 'text' && 'text' in it) {
            text = it.text
          }
        })
      })
      chatMessage.content = text
    }
    return chatMessage
  }
}

// 消息类型
export type LarkMessage = {
  createTime: number;
  support: boolean;
  openChatId: string;
  openMessageId: string;
  messageType: 'text' | 'interactive';
  content: string; // 实际是JSON字符串，根据messageType可解析为TextMessageContent或InteractiveMessageContent
  status: boolean;
  sender: MessageSender;
};

export function getMessageContent(msg?: LarkMessage): (TextMessageContent | InteractiveMessageContent | undefined) {
  if (!msg) {
    return undefined;
  }
  try {
    if (msg.messageType === 'text') {
      return JSON.parse(msg.content) as TextMessageContent;
    } else if (msg.messageType === 'interactive') {
      return JSON.parse(msg.content) as InteractiveMessageContent;
    }
  } catch (error) {
    return undefined
  }
  return undefined;
}

// 获取消息详情响应内容类型
export type GetMsgDetailContent = {
  actionTime: number;
  messages: LarkMessage[];
};

// 获取消息详情响应类型
export type GetMsgDetailResp = {
  errMsg: string;
  bizType: string;
  content: GetMsgDetailContent;
};