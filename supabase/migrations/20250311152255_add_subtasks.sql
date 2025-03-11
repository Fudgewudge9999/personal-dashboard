-- Create subtasks table
create table subtasks (
  id uuid default uuid_generate_v4() primary key,
  task_id uuid references tasks(id) on delete cascade,
  title text not null,
  status text not null default 'pending' check (status in ('pending', 'completed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone,
  user_id uuid references auth.users(id) on delete cascade,
  
  -- Inherit the task's RLS policies through the task_id foreign key
  constraint fk_task foreign key (task_id) references tasks(id) on delete cascade
);

-- Set up RLS for subtasks
alter table subtasks enable row level security;

-- Create policies for subtasks
create policy "Users can view their own subtasks"
  on subtasks for select
  using (auth.uid() = user_id);

create policy "Users can insert their own subtasks"
  on subtasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own subtasks"
  on subtasks for update
  using (auth.uid() = user_id);

create policy "Users can delete their own subtasks"
  on subtasks for delete
  using (auth.uid() = user_id);
