export type IndicatorStatus = 'online' | 'offline'

export interface AtomicIndicator {
  id: string
  nameCn: string
  nameEn: string
  description: string
  status: IndicatorStatus
  modelId: string
  modelName: string
  assetCatalog: string[]
  subject: string
  bizOwner: string
  bizOwnerName: string
  techOwner: string
  techOwnerName: string
  collaborators: string[]
  expression: string
  expressionMode: 'select' | 'input'
  fieldId?: string
  functionId?: string
  applicableDimensions: string[]
  timeDimension?: string
  createTime: string
  updateTime: string
}

export interface User {
  id: string
  name: string
  enName: string
}

export interface AssetCatalogNode {
  id: string
  label: string
  children?: AssetCatalogNode[]
}

export interface Model {
  id: string
  nameCn: string
  nameEn: string
  fields: ModelField[]
}

export interface ModelField {
  id: string
  name: string
  type: string
  isTime?: boolean
}

export interface AggregateFunction {
  id: string
  name: string
  sql: string
}

export interface BaseIndicator {
  id: string
  name: string
  nameEn?: string
  status: IndicatorStatus
  owner: string
  createTime: string
}

export type TimePeriodType = 'relative' | 'fixed'

export type RelativeTimeDesc = 'recent' | 'ago'

export type TimeGranularity = 'day' | 'week' | 'month' | 'quarter' | 'year'

export interface TimePeriod {
  id: string
  nameCn: string
  nameEn: string
  templateType: TimePeriodType
  status: IndicatorStatus
  refCount: number
  owner: string
  ownerName: string
  createTime: string
  description?: string
  sqlExpression?: string
  /** 相对时间：时间描述 */
  relativeDesc?: RelativeTimeDesc
  /** 相对时间：时间粒度 */
  granularity?: TimeGranularity
  /** 相对时间：X 数值 */
  relativeN?: number
  /** 固定时间：开始时间 */
  fixedStart?: string
  /** 固定时间：结束时间 */
  fixedEnd?: string
}

export interface DerivedIndicator {
  id: string
  nameCn: string
  nameEn: string
  owner: string
  ownerName: string
  status: IndicatorStatus
  createTime: string
}
