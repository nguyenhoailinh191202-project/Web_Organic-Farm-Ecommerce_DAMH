<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $sql = File::get(database_path('seeders/sql/seed_nong_san_sach.sql'));
        DB::unprepared($sql);

        $this->call(StorefrontSeeder::class);
    }
}
