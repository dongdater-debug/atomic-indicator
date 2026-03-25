import { describe, it, expect } from 'vitest'

function validateNameCn(name: string): string | null {
  if (!name || !name.trim()) return '请输入指标中文名称'
  if (!/^[\u4e00-\u9fa5a-zA-Z0-9_]+$/.test(name)) return '仅支持中文、数字、下划线'
  if (name.length > 30) return '长度不能超过30字'
  return null
}

function validateNameEn(name: string): string | null {
  if (!name || !name.trim()) return '请输入指标英文名称'
  if (!/^[a-zA-Z0-9_]+$/.test(name)) return '仅支持英文、数字、下划线'
  if (name.length > 30) return '长度不能超过30字'
  return null
}

describe('validation utils', () => {
  describe('validateNameCn', () => {
    it('returns error for empty input', () => {
      expect(validateNameCn('')).toBe('请输入指标中文名称')
      expect(validateNameCn('   ')).toBe('请输入指标中文名称')
    })

    it('accepts valid Chinese name', () => {
      expect(validateNameCn('订单数量')).toBeNull()
      expect(validateNameCn('订单_数量_123')).toBeNull()
    })

    it('rejects invalid characters', () => {
      expect(validateNameCn('订单@数量')).not.toBeNull()
      expect(validateNameCn('订单 数量')).not.toBeNull()
    })

    it('rejects names longer than 30 chars', () => {
      expect(validateNameCn('a'.repeat(31))).toBe('长度不能超过30字')
    })
  })

  describe('validateNameEn', () => {
    it('returns error for empty input', () => {
      expect(validateNameEn('')).toBe('请输入指标英文名称')
    })

    it('accepts valid English name', () => {
      expect(validateNameEn('order_count')).toBeNull()
      expect(validateNameEn('OrderCount123')).toBeNull()
    })

    it('rejects Chinese characters', () => {
      expect(validateNameEn('订单数量')).not.toBeNull()
    })
  })
})
