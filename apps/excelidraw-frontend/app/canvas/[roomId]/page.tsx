import { useEffect ,useRef} from "react"




export default function (){
    const canvasRef = useRef(null);
    useEffect(()=>{

    })
    return <div>
        drawings page
        <canvas ref= {canvasRef}></canvas>
    </div>

}