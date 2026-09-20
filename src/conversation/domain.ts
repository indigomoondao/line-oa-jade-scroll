export type Contact = {
  id: number;
  externalUserId: string;
  displayName: string | null;
  pictureUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type MessageType = "text";

type BaseMessage = {
  id: number;
  contactId: number;
  type: MessageType;
  content: string;
  createdAt: Date;
  updatedAt: Date;
};

export type InboundMessage = BaseMessage & {
  direction: "inbound";
  status: "received";
  externalMessageId: string;
};

export type OutboundMessage = BaseMessage & {
  direction: "outbound";
  status: "sent" | "failed";
  externalMessageId: null;
};

export type Message = InboundMessage | OutboundMessage;

export type Conversation = {
  contact: Contact;
  lastMessage: Message | null;
};
