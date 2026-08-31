import LoginForm from './LoginForm';
import styles from './login.module.css';

export const metadata = {
  title: 'Executive login — CS Club',
  description: 'Secure CS Club executive dashboard login.',
};

export default function LoginPage() {
  return (
    <div className={styles.page}>
      <section className={styles.panel}>
        <p className={styles.kicker}>Executive access</p>
        <h1>Welcome back.</h1>
        <p className={styles.copy}>Sign in with your whitelisted executive account.</p>
        <LoginForm />
      </section>
    </div>
  );
}
