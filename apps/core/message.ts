export type CommunicationMessagePayload = {
  content: string
  sender: string
  recipient: string
  contentType: string
}

export class CommunicationMessage {
  private readonly _payload: CommunicationMessagePayload

  constructor(private payload: CommunicationMessagePayload) {
    this._payload = payload
  }

  public get content(): string {
    return this._payload.content
  }

  public get sender(): string {
    return this._payload.sender
  }

  public get recipient(): string {
    return this._payload.recipient
  }

  public get contentType(): string {
    return this._payload.contentType
  }

  toJson() {
    return {
      content: this.content,
      sender: this.sender,
      recipient: this.recipient,
      contentType: this.contentType,
    }
  }
}
