export interface Element {
    name: string,
    color: string,
    createdOn: number,
    creator: string,
    pioneer: string,
    comment: string,
    parents: string[],
}

export type ElementMap = Record<string, Record<string, Element>>;