import './styles.css'; import {Nav} from '@/components/Nav';
export const metadata={title:'WAT Job Radar 2027',description:'Near real-time Work & Travel USA 2027 job aggregator'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="th"><body><Nav/>{children}</body></html>}
