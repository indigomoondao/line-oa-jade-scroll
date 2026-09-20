export class ContactNotFoundError extends Error {
  constructor(contactId: number) {
    super(`Contact ${contactId} not found`);
    this.name = "ContactNotFoundError";
  }
}

export class InvalidMessageContentError extends Error {
  constructor() {
    super("Message content must not be empty");
    this.name = "InvalidMessageContentError";
  }
}
