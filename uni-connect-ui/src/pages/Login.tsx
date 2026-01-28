import '../styles/main.css'
import logo from "../assets/uni-connect-sm.png"
import { createUser, GetCoreUserByEmail, getUserByEmail, loginUser } from '../services/auth-api'
import React from 'react'
import { showError, showSuccess } from '../components/Toast'
import Spinner from '../components/Spinner'
import { useNavigate } from 'react-router-dom'

function IconMail(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...props}>
            <path
                fill="currentColor"
                d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4.2-7.4 4.63a1 1 0 0 1-1.06 0L4 8.2V6l8 5 8-5v2.2Z"
            />
        </svg>
    )
}

function IconArrowRight(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...props}>
            <path
                fill="currentColor"
                d="M13.17 5.29a1 1 0 0 0 0 1.42L17.46 11H4a1 1 0 0 0 0 2h13.46l-4.29 4.29a1 1 0 1 0 1.42 1.42l6-6a1 1 0 0 0 0-1.42l-6-6a1 1 0 0 0-1.42 0Z"
            />
        </svg>
    )
}

function IconLock(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...props}>
            <path
                fill="currentColor"
                d="M17 10h-1V8a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v7a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-7a2 2 0 0 0-2-2ZM10 8a2 2 0 1 1 4 0v2h-4V8Zm7 11a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-7h10v7Z"
            />
        </svg>
    )
}

function IconEye(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...props}>
            <path
                fill="currentColor"
                d="M12 5c5.5 0 9.8 4.6 10 6.8-.2 2.2-4.5 7.2-10 7.2S2.2 14 2 11.8C2.2 9.6 6.5 5 12 5Zm0 11.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0-2.4a2.1 2.1 0 1 1 0-4.2 2.1 2.1 0 0 1 0 4.2Z"
            />
        </svg>
    )
}

function IconEyeOff(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...props}>
            <path
                fill="currentColor"
                d="M4.7 3.3a1 1 0 0 0-1.4 1.4l2 2C3.4 8.1 2.2 10 2 11.8 2.2 14 6.5 19 12 19c1.8 0 3.4-.4 4.8-1l2.5 2.5a1 1 0 0 0 1.4-1.4l-16-16ZM12 17c-4.1 0-7.6-3.2-8-5.2.2-1 .9-2.4 2.2-3.6l2.1 2.1a4.5 4.5 0 0 0 5.4 5.4l1.5 1.5c-1 .5-2.1.8-3.2.8Zm0-9.5c-.3 0-.6 0-.9.1l-1.6-1.6c.8-.3 1.6-.5 2.5-.5 5.5 0 9.8 4.6 10 6.8-.1 1.1-1.2 2.9-2.9 4.3l-2.2-2.2c.7-.7 1.1-1.6 1.1-2.6A4.5 4.5 0 0 0 12 7.5Z"
            />
        </svg>
    )
}

export default function Login() {
    const [email, setEmail] = React.useState("");
    const [isOpenPasswordFields, setIsOpenPasswordFields] = React.useState(false);
    const [isLoginMode, setIsLoginMode] = React.useState(false);
    const [user, setUser] = React.useState<any>(null);
    const [password, setPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [showPassword, setShowPassword] = React.useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setIsLoading(true);
        try {
            const response = await getUserByEmail(email);
            setTimeout(() => {
                setIsLoading(false);
                showSuccess("User already exists. Please login.");
                setUser(response.data);
                setIsLoginMode(true);
            }, 3000);
        } catch (error: any) {
            setIsLoading(false);
            setIsLoginMode(false);
            if (error.response.data.Message === "User not found") {
                handleGetCoreUser(email);
            }
        }
    };

    const handleGetCoreUser = async (email: string) => {
        try {
            const response = await GetCoreUserByEmail(email);
            setUser(response.data);
            setIsOpenPasswordFields(true);
        } catch (error: any) {
            setIsOpenPasswordFields(false);
            showError(error.response.data.Message === "Core user not found." ? "No account found with this email." : error.response.data.Message);
        }
    }

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            showError('Please verify your email first.');
            return;
        }

        if (!password || !confirmPassword) {
            showError('Please enter and confirm your password.');
            return;
        }

        if (password !== confirmPassword) {
            showError("Passwords do not match.");
            return;
        }

        setIsLoading(true);

        const userData = {
            email: email,
            password: password,
            userName: user.username,
            gender: user.gender,
            userType: user.userTypeName === "Student" ? 1 : 2,
        };

        try {
            await createUser(userData);
            setTimeout(() => {
                setIsLoading(false);
                showSuccess('Account created successfully.');
                setIsLoginMode(true);
            }, 3000);
        } catch (error: any) {
            setIsLoading(false);
            setIsLoginMode(false);
            showError(error.response.data.Message || "An error occurred while creating the user.");
        }
    }

    const handleLoginUser = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            showError('Please enter your email and password.');
            return;
        }

        setIsLoading(true);

        const loginData = {
            email: email,
            password: password,
        };

        try {
            const res = await loginUser(loginData);
            sessionStorage.setItem('jwtToken', res.data.token);
            sessionStorage.setItem('userId', res.data.id);
            sessionStorage.setItem('userName', res.data.username);
            sessionStorage.setItem('userType', res.data.userType === 1 ? 'Student' : 'Teacher');
            setTimeout(() => {
                setIsLoading(false);
                showSuccess('Logged in successfully.');
                navigate('/app/posts');
            }, 3000);
        } catch (error: any) {
            setIsLoading(false);
            showError(error.response.data.Message || "An error occurred while logging in.");
        }
    };

    return (
        <div className="loginShell">
            <Spinner isLoading={isLoading} />
            <section className="loginModal" aria-label="Create profile">
                <header className="loginTopbar">
                    <img className='logo' src={logo} alt="UniConnect logo" />
                </header>

                {!isLoginMode && (
                    <div className="loginBody">
                        <h1 className="loginTitle">CREATE YOUR PROFILE</h1>
                        <p className="loginSub">
                            Already have an account? <a style={{cursor: "pointer", color: "gray"}} onClick={() => setIsLoginMode(true)}>Login</a>
                        </p>

                        <form
                            className="form"
                            onSubmit={(e) => (isOpenPasswordFields ? handleCreateUser(e) : handleSubmit(e))}
                        >
                            <label className="fieldLabel" htmlFor="email">
                                Email Address
                            </label>
                            <div className="inputWrap">
                                <span className="inputIcon" aria-hidden="true">
                                    <IconMail />
                                </span>
                                <input
                                    className="input"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    placeholder="Enter your email address"
                                    required
                                />
                            </div>

                            {isOpenPasswordFields && (
                                <>
                                    <label className="fieldLabel" htmlFor="password">
                                        Password
                                    </label>
                                    <div className="inputWrap">
                                        <span className="inputIcon" aria-hidden="true">
                                            <IconLock />
                                        </span>
                                        <input
                                            className="input hasRightIcon"
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            autoComplete="current-password"
                                            placeholder="Enter your password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="inputRightBtn"
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                            onClick={() => setShowPassword((v) => !v)}
                                        >
                                            {showPassword ? <IconEyeOff /> : <IconEye />}
                                        </button>
                                    </div>
                                    <label className="fieldLabel" htmlFor="confirmPassword">
                                        Confirm Password
                                    </label>
                                    <div className="inputWrap">
                                        <span className="inputIcon" aria-hidden="true">
                                            <IconLock />
                                        </span>
                                        <input
                                            className="input hasRightIcon"
                                            id="confirmPassword"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            autoComplete="current-password"
                                            placeholder="Confirm your password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="inputRightBtn"
                                            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                            onClick={() => setShowConfirmPassword((v) => !v)}
                                        >
                                            {showConfirmPassword ? <IconEyeOff /> : <IconEye />}
                                        </button>
                                    </div>
                                </>
                            )}

                            <button className="primaryBtn" type="submit">
                                Next
                                <span className="primaryBtnIcon" aria-hidden="true">
                                    <IconArrowRight />
                                </span>
                            </button>
                        </form>

                        <p className="legal">
                            By registering, you accept UniConnect <a href="#tos" style={{color: "gray"}}>Terms</a>{' '}
                            and <a href="#privacy" style={{color: "gray"}}>Privacy policy</a>.
                        </p>
                    </div>
                )}

                {isLoginMode && (
                    <div className="loginBody">
                        <h1 className="loginTitle">LOGIN TO YOUR ACCOUNT</h1>
                        <p className="loginSub">
                            Don't have an account? <a style={{cursor: "pointer", color: "gray"}} onClick={() => setIsLoginMode(false)}>Create one</a>
                        </p>
                        <form className="form" onSubmit={handleLoginUser}>
                            <label className="fieldLabel" htmlFor="emailLogin">
                                Email Address
                            </label>
                            <div className="inputWrap">
                                <span className="inputIcon" aria-hidden="true">
                                    <IconMail />
                                </span>
                                <input
                                    className="input"
                                    id="emailLogin"
                                    type="email"
                                    autoComplete="email"
                                    placeholder="Enter your email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            {/* Password input field */}
                            <label className="fieldLabel" htmlFor="passwordLogin">
                                Password
                            </label>
                            <div className="inputWrap">
                                <span className="inputIcon" aria-hidden="true">
                                    <IconLock />
                                </span>
                                <input
                                    className="input hasRightIcon"
                                    id="passwordLogin"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    type="password"
                                    autoComplete="current-password"
                                    placeholder="Enter your password"
                                    required
                                />
                                <button
                                    type="button"
                                    className="inputRightBtn"
                                    aria-label="Show password"
                                >
                                    <IconEye />
                                </button>
                            </div>
                            <button className="primaryBtn" type="submit">
                                Login
                                <span className="primaryBtnIcon" aria-hidden="true">
                                    <IconArrowRight />
                                </span>
                            </button>
                        </form>
                    </div>
                )}

            </section>
        </div>
    )
}