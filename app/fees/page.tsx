import FeeCalculator from '@/components/FeeCalculator';

export const revalidate = 60;

export const metadata = {
  title: 'เปรียบเทียบค่าใช้จ่าย 8 Agency Work & Travel 2027 | WAT Job Radar',
  description: 'เจาะลึกค่าโครงการ งวดชำระเงิน ค่าวีซ่า ตั๋วเครื่องบิน เงินติดตัว และนโยบายคืนเงินของ 8 Agency Work & Travel ชั้นนำ'
};

export default function FeesPage() {
  return (
    <main className="page">
      <FeeCalculator />
    </main>
  );
}
