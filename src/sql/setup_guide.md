# Setting Up a New Supabase Database for Reflection Nook

This guide will walk you through creating a new Supabase database and linking it to your Reflection Nook project.

## Step 1: Create a New Supabase Project

1. **Sign up/Sign in to Supabase**:
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Create an account if you don't have one, or sign in with your existing account

2. **Create a New Project**:
   - Click on "New Project" in the dashboard
   - Choose an organization (create one if needed)
   - Enter a name for your project (e.g., "reflection-nook")
   - Set a secure database password (save this somewhere safe)
   - Choose a region closest to your users for better performance
   - Select the free plan or a paid plan based on your needs
   - Click "Create New Project"

3. **Wait for Setup**:
   - Supabase will create your project, which may take a few minutes
   - Once complete, you'll be redirected to your project dashboard

## Step 2: Set Up the Database Schema

1. **Access SQL Editor**:
   - In your Supabase dashboard, click on "SQL Editor" in the left sidebar
   - Click "New Query" to create a new SQL script

2. **Create Database Schema**:
   - Copy the contents of the `schema.sql` file we created
   - Paste it into the SQL Editor
   - Click "Run" to execute the SQL and create all the necessary tables

3. **Verify Tables**:
   - Go to the "Table Editor" in the left sidebar
   - You should see all the tables we created: categories, resources, tasks, habits, and events

## Step 3: Update Project Configuration

1. **Get API Credentials**:
   - In your Supabase dashboard, go to your project
   - Click on "Project Settings" in the sidebar
   - Click on "API" in the submenu
   - You'll find your "Project URL" and "anon" key (public API key)

2. **Update Client Configuration**:
   - Open the file `src/integrations/supabase/client.ts` in your project
   - Replace the `SUPABASE_URL` value with your new project URL
   - Replace the `SUPABASE_PUBLISHABLE_KEY` value with your new anon key
   - Save the file

## Step 4: Test the Connection

1. **Run Your Application**:
   - Start your application in development mode
   - Try to access the Resources page or any other page that interacts with the database
   - Check if data is being fetched and displayed correctly

2. **Add Test Data**:
   - Try adding a new category and a new resource
   - Verify that they are saved to your new Supabase database

## Troubleshooting

If you encounter any issues:

1. **Check Console Errors**:
   - Open your browser's developer tools
   - Look for any errors in the console related to Supabase

2. **Verify API Keys**:
   - Double-check that you've copied the correct URL and anon key
   - Make sure there are no extra spaces or characters

3. **Check Database Schema**:
   - Verify that all tables were created correctly
   - Compare the schema with the types defined in `types.ts`

4. **Enable Debugging**:
   - You can enable debug mode in the Supabase client by adding a third parameter:
     ```typescript
     export const supabase = createClient<Database>(
       SUPABASE_URL, 
       SUPABASE_PUBLISHABLE_KEY,
       { 
         auth: { 
           debug: true 
         } 
       }
     );
     ```

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase SQL Editor](https://supabase.com/docs/guides/database/sql-editor)
- [Supabase Table Editor](https://supabase.com/docs/guides/database/tables) 