-- Create RPC function to safely decrement inventory
CREATE OR REPLACE FUNCTION decrement_inventory(variant_id UUID, quantity INT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_stock INT;
BEGIN
  -- Lock the row for update to prevent concurrent race conditions
  SELECT inventory_count INTO current_stock
  FROM product_variants
  WHERE id = variant_id
  FOR UPDATE;
  
  IF current_stock IS NULL THEN
    RAISE EXCEPTION 'Variant not found';
  END IF;
  
  IF current_stock < quantity THEN
    RAISE EXCEPTION 'Insufficient stock. Requested %, but only % available', quantity, current_stock;
  END IF;
  
  -- Deduct stock
  UPDATE product_variants
  SET inventory_count = inventory_count - quantity,
      updated_at = NOW()
  WHERE id = variant_id;
  
  RETURN TRUE;
END;
$$;
