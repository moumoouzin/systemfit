-- Create a table to store user settings like API keys and preferred models
create table if not exists public.user_settings (
    user_id uuid not null references auth.users(id) on delete cascade,
    key text not null,
    value text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (user_id, key)
);

-- Enable RLS
alter table public.user_settings enable row level security;

-- Create policies
create policy "Users can view their own settings"
    on public.user_settings for select
    using (auth.uid() = user_id);

create policy "Users can insert their own settings"
    on public.user_settings for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own settings"
    on public.user_settings for update
    using (auth.uid() = user_id);

create policy "Users can delete their own settings"
    on public.user_settings for delete
    using (auth.uid() = user_id);

-- Create updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger handle_updated_at
    before update on public.user_settings
    for each row
    execute procedure public.handle_updated_at();
