export type MessagingProfile = {
  displayName: string;
  pictureUrl: string | null;
};

export type SendTextInput = {
  recipientId: string;
  content: string;
};

export interface MessagingGateway {
  getProfile(externalUserId: string): Promise<MessagingProfile>;

  sendText(input: SendTextInput): Promise<void>;
}
