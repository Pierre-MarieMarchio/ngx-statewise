export interface IUpdator<S> {
  readonly state: S;
  readonly updators: UpdatorRegistry<S>;

}
export type Updator<S, P = any> = (state: S, payload?: P) => void;

export interface UpdatorRegistry<S> {
  [actionType: string]: Updator<S>;
}
