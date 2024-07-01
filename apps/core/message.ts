export type CommunicationMessagePayload = {
  content: string
  sender: string
  recipient: string
  service: string
  contentType: string
}

export class CommunicationMessage {
  private readonly _payload: CommunicationMessagePayload

  constructor(payload: CommunicationMessagePayload) {
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

  public get service(): string {
    return this._payload.service
  }

  toJson() {
    return {
      content: this.content,
      sender: this.sender,
      recipient: this.recipient,
      contentType: this.contentType,
      service: this.service,
    }
  }
}
