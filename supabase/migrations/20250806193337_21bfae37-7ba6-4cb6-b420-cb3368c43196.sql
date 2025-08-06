-- Fix security warnings by setting search_path for functions

-- Update handle_new_user function with proper search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'display_name');
  
  -- Create default categories for new user
  INSERT INTO public.categories (user_id, name, category_type, color) VALUES
    (NEW.id, 'Food & Dining', 'expense', '#f97316'),
    (NEW.id, 'Transportation', 'expense', '#3b82f6'),
    (NEW.id, 'Entertainment', 'expense', '#a855f7'),
    (NEW.id, 'Utilities', 'expense', '#eab308'),
    (NEW.id, 'Shopping', 'expense', '#ec4899'),
    (NEW.id, 'Health & Medical', 'expense', '#10b981'),
    (NEW.id, 'Investment', 'expense', '#6366f1'),
    (NEW.id, 'Salary', 'income', '#059669'),
    (NEW.id, 'Freelance', 'income', '#0d9488'),
    (NEW.id, 'Other Income', 'income', '#0891b2');
  
  -- Create default accounts for new user
  INSERT INTO public.accounts (user_id, name, account_type, currency) VALUES
    (NEW.id, 'Main Checking', 'checking', 'GBP'),
    (NEW.id, 'Savings Account', 'savings', 'GBP'),
    (NEW.id, 'Credit Card', 'credit', 'GBP');
  
  RETURN NEW;
END;
$$;

-- Update calculate_gbp_amount function with proper search_path
CREATE OR REPLACE FUNCTION public.calculate_gbp_amount()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  IF NEW.currency = 'GBP' THEN
    NEW.amount_gbp = NEW.amount;
    NEW.exchange_rate = 1.0;
  ELSE
    -- If exchange rate is provided, use it, otherwise default to 1.0
    IF NEW.exchange_rate IS NULL THEN
      NEW.exchange_rate = 1.0;
    END IF;
    NEW.amount_gbp = NEW.amount * NEW.exchange_rate;
  END IF;
  
  RETURN NEW;
END;
$$;