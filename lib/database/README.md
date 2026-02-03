# 데이터베이스 설정 가이드

## Supabase 설정

1. Supabase 프로젝트 생성 후 SQL Editor로 이동
2. `schema.sql` 파일의 전체 내용을 복사하여 실행
3. 테이블이 정상적으로 생성되었는지 확인

## 테이블 구조

### daily_capacity
요일별 재고(Capa) 설정 및 현재 주문 수량 관리

### orders
주문 정보 저장

### customers
고객 정보 및 주문 이력 관리

### order_customer
주문과 고객의 관계 테이블 (주문 이력 추적용)

## 트리거

- `update_order_count`: 주문 생성 시 자동으로 재고 차감
- `decrease_order_count`: 주문 삭제 시 자동으로 재고 복구
- `update_updated_at_column`: updated_at 자동 업데이트

## 초기 데이터 설정

요일별 기본 Capa를 설정하려면 다음 SQL을 실행하세요:

```sql
-- 다음 주 월요일부터 금요일까지 기본 Capa 50개 설정
INSERT INTO daily_capacity (date, max_capa)
VALUES 
  ('2026-02-09', 50),
  ('2026-02-10', 50),
  ('2026-02-11', 50),
  ('2026-02-12', 50),
  ('2026-02-13', 50)
ON CONFLICT (date) DO NOTHING;
```
