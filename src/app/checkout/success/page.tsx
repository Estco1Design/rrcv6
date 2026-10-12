import {redirect} from 'next/navigation';
// Legacy demo URLs must not claim that a real order has been placed.
export default function LegacySuccessPage() { redirect('/checkout'); }
