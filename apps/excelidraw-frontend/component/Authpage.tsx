"use client"

export function Authpage({isSignin}:{
    isSignin:boolean
}){
    return <div className="w-screen h-screen bg-black flex justify-center items-center">
                <div className="p-6 m-2 bg-white rounded bg-gray-500">
                        <div className="p-2 rounded">
                            <input type = "text" placeholder="Email"/>
                        </div>
                        <div className="p-2 rounded">
                            <input type="password" placeholder="Password" />
                        </div>
                        <div className="pt-2 pl-4 flex justify-center">
                            <button className=" p-2 bg-red-400 rounded" onClick={()=>{
                            }}>{isSignin? "Sign in":"Sign up"}</button>
                        </div>
                </div>
                
    </div>
}