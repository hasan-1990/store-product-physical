declare module 'smsir-js' {
  export class Smsir {
    constructor(apiKey: string, lineNumber: string | number);
    
    SendBulk(
      mobiles: string[],
      message: string,
      lineNumber: string | number,
      sendDateTime?: Date
    ): Promise<{
      MessageId?: string;
      IsSuccessful: boolean;
      Message: string;
    }>;

    VerifySend(
      mobile: string,
      templateId: number,
      parameters: Array<{
        name: string;
        value: string;
      }>
    ): Promise<{
      MessageId?: string;
      IsSuccessful: boolean;
      Message: string;
    }>;

    GetCredit(): Promise<{
      Credit: number;
      IsSuccessful: boolean;
      Message: string;
    }>;

    GetLineNumbers(): Promise<{
      LineNumbers: string[];
      IsSuccessful: boolean;
      Message: string;
    }>;
  }
}
