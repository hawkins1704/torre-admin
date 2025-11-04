import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const SignIn = () => {
    const { signIn } = useAuthActions();
    const [step, setStep] = useState<"signUp" | "signIn">("signIn");
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                {/* Card Container */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                            Torre Admin
                        </h1>
                        <p className="text-gray-600">
                            {step === "signIn"
                                ? "Inicia sesión en tu cuenta"
                                : "Crea una nueva cuenta"}
                        </p>
                    </div>

                    {/* Form */}
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            const formData = new FormData(event.currentTarget);
                            void signIn("password", formData);
                            navigate("/dashboard");
                        }}
                        className="space-y-6"
                    >
                        {/* Email Input */}
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                placeholder="tu@email.com"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                            />
                        </div>

                        {/* Password Input */}
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Contraseña
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                placeholder="••••••••"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                            />
                        </div>

                        <input name="flow" type="hidden" value={step} />

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="w-full bg-green-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                        >
                            {step === "signIn"
                                ? "Iniciar sesión"
                                : "Crear cuenta"}
                        </button>
                    </form>

                    {/* Toggle Sign In/Sign Up */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            className="w-full text-center text-sm text-gray-600  transition-colors"
                        >
                            {step === "signIn" ? (
                                <>
                                    ¿No tienes una cuenta?
                                    <span
                                        className="font-medium text-green-600 hover:text-green-700"
                                        onClick={() => {
                                            // setStep("signUp");
                                        }}
                                    >
                                        Regístrate aquí
                                    </span>
                                </>
                            ) : (
                                <>
                                    ¿Ya tienes una cuenta?
                                    <span
                                        className="font-medium text-green-600 hover:text-green-700"
                                        onClick={() => {
                                            setStep("signIn");
                                        }}
                                    >
                                        Inicia sesión aquí
                                    </span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <p className="mt-6 text-center text-sm text-gray-500">
                    Sistema de administración de Torre
                </p>
            </div>
        </div>
    );
};

export default SignIn;
