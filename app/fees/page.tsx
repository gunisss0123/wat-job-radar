import FeeCalculator from '@/components/FeeCalculator';

export const revalidate = 60;

export const metadata = {
  title: 'เปรียบเทียบค่าใช้จ่าย 8 Agency Work & Travel 2027 | WAT Job Radar',
  description: 'ตรวจค่าใช้จ่ายและ sponsor ของ 8 Agency Work & Travel 2027 พร้อมแหล่งทางการ วันที่ตรวจ ขอบเขตแพ็กเกจ และสถานะข้อมูลที่ยังยืนยันไม่ได้'
};

export default function FeesPage() {
  return (
    <main className="page">
      <FeeCalculator />
    </main>
  );
}
