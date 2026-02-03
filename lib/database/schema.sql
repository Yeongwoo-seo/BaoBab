-- Bao Bab 데이터베이스 스키마

-- 요일별 Capa 설정 테이블
CREATE TABLE IF NOT EXISTS daily_capacity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  max_capa INTEGER NOT NULL DEFAULT 50,
  current_order_count INTEGER NOT NULL DEFAULT 0,
  is_closed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 주문 테이블
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name VARCHAR(100) NOT NULL,
  contact VARCHAR(20) NOT NULL,
  location VARCHAR(50) NOT NULL CHECK (location IN ('Kings Park', 'Eastern Creek')),
  order_dates DATE[] NOT NULL,
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 고객 테이블 (CRM)
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  contact VARCHAR(20) NOT NULL UNIQUE,
  location VARCHAR(50),
  total_orders INTEGER DEFAULT 0,
  is_blacklisted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 주문-고객 관계 테이블 (주문 이력 추적)
CREATE TABLE IF NOT EXISTS order_customer (
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  PRIMARY KEY (order_id, customer_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_daily_capacity_date ON daily_capacity(date);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_location ON orders(location);
CREATE INDEX IF NOT EXISTS idx_customers_contact ON customers(contact);

-- 트리거: 주문 생성 시 current_order_count 업데이트
CREATE OR REPLACE FUNCTION update_order_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE daily_capacity
  SET current_order_count = current_order_count + 1,
      updated_at = NOW()
  WHERE date = ANY(NEW.order_dates);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_order_count
AFTER INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION update_order_count();

-- 트리거: 주문 삭제 시 current_order_count 감소
CREATE OR REPLACE FUNCTION decrease_order_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE daily_capacity
  SET current_order_count = GREATEST(current_order_count - 1, 0),
      updated_at = NOW()
  WHERE date = ANY(OLD.order_dates);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_decrease_order_count
AFTER DELETE ON orders
FOR EACH ROW
EXECUTE FUNCTION decrease_order_count();

-- 트리거: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_daily_capacity_updated_at
BEFORE UPDATE ON daily_capacity
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON customers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
