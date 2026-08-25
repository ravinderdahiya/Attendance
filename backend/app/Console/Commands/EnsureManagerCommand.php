<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class EnsureManagerCommand extends Command
{
    protected $signature = 'app:ensure-manager
                            {--username= : Manager username (default: MANAGER_USERNAME env)}
                            {--password= : Manager password (default: MANAGER_PASSWORD env)}
                            {--name=Restaurant Manager : Display name}';

    protected $description = 'Create or update the manager login used by the admin panel';

    public function handle(): int
    {
        $username = $this->option('username') ?: env('MANAGER_USERNAME');
        $password = $this->option('password') ?: env('MANAGER_PASSWORD');

        if (! $username || ! $password) {
            $this->warn('Skipped: set MANAGER_USERNAME and MANAGER_PASSWORD (or pass --username/--password).');

            return self::SUCCESS;
        }

        $user = User::query()->firstOrNew(['username' => $username]);
        $user->role = 'manager';
        $user->name = $this->option('name') ?: ($user->name ?: 'Restaurant Manager');
        $user->password = $password;
        $user->is_active = true;
        $user->save();

        $this->info("Manager ready: {$username}");

        return self::SUCCESS;
    }
}
