// core
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { SQLitePorter } from '@ionic-native/sqlite-porter';
import { Storage } from '@ionic/storage';

// Interfaces
import { Data } from '../../models/data.interface';

// Config
import { SQLITE_REQ } from '../../configs/sqlite.req';
import { URL } from '../../env/env';



const DATABASE_FILE_NAME: string = 'data.db';

@Injectable()
export class SqliteProvider {

  private sqliteDb: SQLiteObject;
  private RaspServerUrl: string = URL.raspberryPi;
  private measurements : Data[] = [];


  constructor(
    private http        : HttpClient,
    private sqlite      : SQLite,
    private sqlitePorter: SQLitePorter,
    private storage     : Storage) {
  }

  public getDbState() :SQLiteObject {
    return this.sqliteDb;
  }

  public createSQLiteDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.sqlite.create({
        name: DATABASE_FILE_NAME, // if database file already exists -> db will be opened
        location: 'default'
      })
      .then((db: SQLiteObject) => {
        this.sqliteDb = db;
        this.storage.get('tables_created').then((val: boolean) => {
          if (val) {
            console.log('tables already created !');
          } else {
            this.createTables();
          }
          //this.synchroniseAllDatabase();
          resolve();
        });
      })
      .catch((e :any) => console.log(e));
    });
  }


  public requestDataForChart(tableName: string, PollutantType: string): Promise<any> {
   const range = this.getRangeFromTableName(tableName);
   const request = 'SELECT t1.date, t1.value FROM ' + tableName + ' t1 INNER JOIN POLLUTANT t2 ON t1.typeId=t2.id WHERE t2.name = "' + PollutantType + '" ORDER BY t1.date DESC LIMIT ' + range + ';';
   return this.sqliteDb.executeSql(request, {})
   .then((data:any) => {
    this.measurements = []; // to fix bug
    if (data.rows.length > 0) {
      for (var i = 0; i < data.rows.length; i++) {
        this.measurements.push(data.rows.item(i));
      }
      return this.measurements;
    }
   })
   .catch((e:any) => console.log(e));
  }


  private createTables(): Promise<void> {
  return this.sqlitePorter.importSqlToDb(this.sqliteDb, SQLITE_REQ.sql)
    .then(() => {
      console.log('tables created successfully');
      this.storage.set('tables_created', true);
    })
    .catch((e: any) => console.error(e));
  }

  private synchroniseTable(tableName: string): Promise<any> {
    return this.getLastDate(tableName).then((date:string) => {
      const request = tableName + '?filter=Date,gt,' + date +  '&transform=1';
      console.log('url', this.RaspServerUrl + '/' + request);
      return this.http.get(this.RaspServerUrl + '/' + request)
      .map( (res :Object) => {
        res = res[tableName];
        return this.insertNewValuesIntoDb(tableName, res);
      }).toPromise().catch((err: any) => console.log('error', err));
    });
  }

  private insertNewValuesIntoDb(tableName: string, data : any): Promise<any> {
    if (data.length > 0) {
      let request = 'REPLACE INTO ' + tableName + ' (date, value, typeId) VALUES ';
      for (var i = 0; i < data.length - 1; i++) {
         request = request + '("' + data[i].date + '", ' + data[i].value + ', ' + data[i].typeId + '), ';
      }
      request = request + '("' + data[i].date + '", ' + data[i].value + ', ' + data[i].typeId + ' ); ';
      return this.sqliteDb.executeSql(request, {})
      .then((res: any) => console.log(res))
      .catch((e :any) =>  console.log(e));
    }
  }

  private getLastDate(tableName: string): Promise<string> {
    const requestDate = 'SELECT date FROM ' + tableName + ' ORDER BY date DESC LIMIT 1';
    return this.sqliteDb.executeSql(requestDate, {})
    .then((data:any) => (data.rows.length > 0) ? data.rows.item(0).date : '')
    .catch((e :any) => console.log(e));
  }

  public synchroniseAllDatabase() :Promise<any> {
    return Promise.all([
      this.synchroniseTable('AVG_HOUR'),
      this.synchroniseTable('AVG_MONTH'),
      this.synchroniseTable('AVG_DAY'),
      this.synchroniseTable('AVG_YEAR')
    ]).then(() => {
      console.log('test');
    });
  }

  private getRangeFromTableName(tableName: string) : number {
    switch (tableName) {
      case 'AVG_HOUR':
        return 24;
      case 'AVG_DAY':
        return 31;
      case 'AVG_MONTH':
        return 12;
      default:
        return 5;
    }
  }

}