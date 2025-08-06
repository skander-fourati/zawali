-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  base_currency TEXT NOT NULL DEFAULT 'GBP',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create profiles policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create accounts table
CREATE TABLE public.accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('checking', 'savings', 'credit', 'investment', 'cash')),
  currency TEXT NOT NULL DEFAULT 'GBP',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for accounts
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- Create accounts policies
CREATE POLICY "Users can manage their own accounts" 
ON public.accounts 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category_type TEXT NOT NULL CHECK (category_type IN ('income', 'expense')),
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Enable RLS for categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create categories policies
CREATE POLICY "Users can manage their own categories" 
ON public.categories 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'GBP',
  exchange_rate DECIMAL(10,4) DEFAULT 1.0,
  amount_gbp DECIMAL(15,2),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income', 'expense', 'transfer')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create transactions policies
CREATE POLICY "Users can manage their own transactions" 
ON public.transactions 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create family balances table
CREATE TABLE public.family_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  total_sent DECIMAL(15,2) NOT NULL DEFAULT 0,
  last_transaction DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for family balances
ALTER TABLE public.family_balances ENABLE ROW LEVEL SECURITY;

-- Create family balances policies
CREATE POLICY "Users can manage their own family balances" 
ON public.family_balances 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create exchange rates table for historical rates
CREATE TABLE public.exchange_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  rate DECIMAL(10,4) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(date, from_currency, to_currency)
);

-- Enable RLS for exchange rates (public read access)
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

-- Create exchange rates policies
CREATE POLICY "Anyone can read exchange rates" 
ON public.exchange_rates 
FOR SELECT 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_family_balances_updated_at
  BEFORE UPDATE ON public.family_balances
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
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

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function to calculate GBP amount
CREATE OR REPLACE FUNCTION public.calculate_gbp_amount()
RETURNS TRIGGER
LANGUAGE plpgsql
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

-- Create trigger to auto-calculate GBP amounts
CREATE TRIGGER calculate_transaction_gbp_amount
  BEFORE INSERT OR UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_gbp_amount();