import {State} from './state';

export const asyncFilter = async <T>(
  arr: T[],
  predicate: (element: T) => Promise<boolean>
) => {
  const results = await Promise.all(arr.map(predicate));

  return arr.filter((_v, index) => results[index]);
};

export const asyncFirst = async <T>(
  arr: T[],
  predicate: (element: T) => Promise<boolean>
) => {
  const results = await Promise.all(arr.map(predicate));

  return arr.find((_v, index) => results[index]);
};

export const asyncMaxPrioritized = async <T extends State>(
  arr: T[],
  predicate: (element: T) => Promise<boolean>
) => {
  const results = await asyncFilter(arr, predicate);

  if (results.length <= 0) return undefined;

  return results.reduce((prev, curr) =>
    prev.priority >= curr.priority ? prev : curr
  );
};
