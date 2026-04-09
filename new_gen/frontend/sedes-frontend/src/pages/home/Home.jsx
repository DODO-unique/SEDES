import { useState } from 'react'
import AuthLayout from './AuthLayout'
import LoginForm from './LoginForm'
import SignupForm from './SignupForm'

export default function Home() {
    const [mode, setMode] = useState('login');

    return (
        <AuthLayout>
            {mode === 'login' ? (
                <LoginForm onSwitchMode={setMode} />
            ) : (
                <SignupForm onSwitchMode={setMode} />
            )}
        </AuthLayout>
    );
}