<?php

namespace Database\Seeders;

use App\Models\Advance;
use App\Models\Outlet;
use App\Models\Shift;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /** Demo data matching the ShiftTrack mockup, for local dev/testing. */
    public function run(): void
    {
        $outlet = Outlet::create([
            'name' => 'Spice Route Kitchen',
            'address' => 'Sector 15, Hisar',
            'latitude' => 29.1492,
            'longitude' => 75.7217,
            'radius_meters' => 100,
        ]);

        User::create([
            'role' => 'manager',
            'name' => 'Restaurant Manager',
            'username' => 'manager',
            'password' => 'Manager@123',
            'outlet_id' => $outlet->id,
        ]);

        // Every staff login PIN below is 1234 - for local dev only, an admin
        // would set a real PIN per person from the Staff page.
        $staff = [
            ['name' => 'Meera Joshi', 'mobile' => '9810000001', 'staff_code' => 'STF-1042', 'designation' => 'Waiter', 'department' => 'Front of House', 'pay_type' => 'monthly', 'pay_rate' => 15000],
            ['name' => 'Arjun Mehta', 'mobile' => '9810000002', 'staff_code' => 'STF-1043', 'designation' => 'Chef', 'department' => 'Kitchen', 'pay_type' => 'monthly', 'pay_rate' => 22000],
            ['name' => 'Priya Nair', 'mobile' => '9810000003', 'staff_code' => 'STF-1044', 'designation' => 'Cashier', 'department' => 'Front of House', 'pay_type' => 'monthly', 'pay_rate' => 16000],
            ['name' => 'Vikram Singh', 'mobile' => '9810000004', 'staff_code' => 'STF-1045', 'designation' => 'Delivery', 'department' => 'Delivery', 'pay_type' => 'daily', 'pay_rate' => 500],
            ['name' => 'Simran Kaur', 'mobile' => '9810000005', 'staff_code' => 'STF-1046', 'designation' => 'Host', 'department' => 'Front of House', 'pay_type' => 'daily', 'pay_rate' => 450],
        ];

        $createdStaff = [];
        foreach ($staff as $member) {
            $createdStaff[] = User::create([...$member, 'role' => 'staff', 'outlet_id' => $outlet->id, 'password' => '1234']);
        }

        // Today's roster - reasonable shift windows so the timesheet's
        // late/overtime math has something meaningful to compute against.
        $shiftWindows = [
            ['start_time' => '13:00', 'end_time' => '21:00', 'label' => 'Lunch to dinner service'],
            ['start_time' => '09:00', 'end_time' => '17:00', 'label' => 'Kitchen prep & service'],
            ['start_time' => '13:00', 'end_time' => '21:00', 'label' => 'Lunch to dinner service'],
            ['start_time' => '10:00', 'end_time' => '18:00', 'label' => 'Delivery shift'],
            ['start_time' => '11:00', 'end_time' => '19:00', 'label' => 'Front of house'],
        ];
        foreach ($createdStaff as $i => $person) {
            Shift::create([
                'user_id' => $person->id,
                'outlet_id' => $outlet->id,
                'shift_date' => now()->toDateString(),
                ...$shiftWindows[$i % count($shiftWindows)],
            ]);
        }

        // A couple of sample mid-month advances so the Payroll page has
        // something to show deducted from the first two staff members.
        Advance::create(['user_id' => $createdStaff[0]->id, 'amount' => 500, 'note' => 'Personal - cash', 'given_at' => now()->startOfMonth()->addDays(4)]);
        Advance::create(['user_id' => $createdStaff[0]->id, 'amount' => 200, 'note' => 'Lunch advance', 'given_at' => now()->startOfMonth()->addDays(10)]);
        Advance::create(['user_id' => $createdStaff[1]->id, 'amount' => 1000, 'note' => 'Medical', 'given_at' => now()->startOfMonth()->addDays(7)]);
    }
}
