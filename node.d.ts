import { ParsedUrlQuery } from 'querystring';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      RESERVOIR_API_URL: string;
      MYSQL_HOST: string;
      MYSQL_USER: string;
      MYSQL_PASSWORD: string;
      MYSQL_DATABASE: string;
    }
  }
  var env: NodeJS.ProcessEnv;
  var pest: (name: string, fn: Function) => void;
  var expect: (actual: any) => {
    toBe: (expected: any) => void;
    toNotBe: (expected: any) => void;
    toInclude: (expected: any) => void;
    toNotInclude: (expected: any) => void;
    toOccur: (occurence: any) => {
      in: (parent: any[]) => void;
    };
    toBeObject: (expected: any) => void;
    toBeOfType: (expected: any) => void;
  };
  var afterPest: (fn: any) => void;
}
