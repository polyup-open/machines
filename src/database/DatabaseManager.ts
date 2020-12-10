// stub for DatabaseManager from main Polyup project.

export abstract class DBRecord {
  static nextClientRecordId: number = 1;

  public clientRecordId: number;
  public dependsOnRecords: number[] = [];
  public currentlyInSync: boolean = false;

  constructor() {
    this.clientRecordId = DBRecord.nextClientRecordId++;
  }

  abstract assignData(data: any): void;
  abstract assignUploadData(data: any, ignoreCache?: boolean): void;
  abstract getDatabaseId(): number;
}
