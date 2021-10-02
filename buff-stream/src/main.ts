const BUFF_SIZE = 1024;

const Decoder = new TextDecoder();
const Encoder = new TextEncoder();

interface readIntCfg{
	endian:"big"|"little";
}

export default class BuffReader{
	public defaultEndian:"big"|"little"="little";
	constructor(file?:Uint8Array){
		if(file&&file.length>0){
			this.data=file;
			this.fileSize=file.length;
		}else{
			this.data=new Uint8Array(BUFF_SIZE);
		}
	}
	private data:Uint8Array;
	private fileSize=0;

	private _offset=0;
	public get offset():number{
		return this._offset;
	}

	public get length():number{
		return this.fileSize;
	}

	public getData(){
		const ret=new Uint8Array(this.fileSize);
		ret.set(this.data.subarray(0,this.fileSize))
		return ret;
	}

	public readUInt8():number|false{
		if(this._offset<this.fileSize){
			const data = this.data[this._offset++];
			return data;
		}
		return false;
	}
	public writeUInt8(data:number){
		if(this._offset === this.data.length){
			const newData = new Uint8Array(this.data.length+BUFF_SIZE);
			newData.set(this.data);
			this.data=newData
		}
		this.data[this._offset++]=data;
		if(this.offset>this.fileSize) this.fileSize=this.offset;
	}
	public readUInt16(cfg?:readIntCfg):number|false{
		if(this._offset+1<this.fileSize){
			this._offset+=2;
			if(((cfg&&cfg.endian)||this.defaultEndian) == "little"){
				return this.data[this._offset-2] | (this.data[this._offset-1]<<8);
			}
			return (this.data[this._offset-2]<<8) | (this.data[this._offset-1]);
		}
		return false;
	}
	public readUInt32(cfg?:readIntCfg):number|false{
		if(this._offset+8<=this.fileSize){
			this._offset+=4;
			if(((cfg&&cfg.endian)||this.defaultEndian) == "little"){
				return this.data[this._offset-4] | (this.data[this._offset-3]<<8) | (this.data[this._offset-2]<<16) | (this.data[this._offset-1]<<24);
			}
			return (this.data[this._offset-4]<<24) | (this.data[this._offset-3]<<16) | (this.data[this._offset-2]<<8) | (this.data[this._offset-1]);
		}
		return false;
	}
	public readUInt64(cfg?:readIntCfg):number|false{
		if(this._offset+8<=this.fileSize){
			this._offset+=8;
			if(((cfg&&cfg.endian)||this.defaultEndian) == "little"){
				return (this.data[this._offset-8] | (this.data[this._offset-7]<<8) | (this.data[this._offset-6]<<16) | (this.data[this._offset-5]<<24)
					| (this.data[this._offset-4] <<32) | (this.data[this._offset-3]<<40) | (this.data[this._offset-2]<<48) | (this.data[this._offset-1]<<56));
			}
			return ((this.data[this._offset-8]<<56) | (this.data[this._offset-7]<<48) | (this.data[this._offset-6]<<40) | (this.data[this._offset-5]<<32)
					| (this.data[this._offset-4]<<24) | (this.data[this._offset-3]<<16) | (this.data[this._offset-2]<<8) | (this.data[this._offset-1]));
		}
		return false;
	}
	public readChar(){
		return this.readUInt8();
	}
	public writeChar(data:string){
		return this.writeUInt8(data.charCodeAt(0));
	}

	public readVarUInt():number{
		let res=0;
		let r:number;
		let i=0;
		do{
			r=this.readUInt8()||0;
			res+=(r&0x7F)<<i;
			i+=7;
		}while(r&0x80)
		return res;
	}
	public writeVarUInt(data:number){
		let int=data;
		while(int>0x7F){
			this.writeUInt8((int&0x7F)|0x80);
			int>>=7;
		}
		this.writeUInt8(int);
	}
	public readStr(){
		const len=this.readVarUInt();
		const res=Decoder.decode(this.data.subarray(this._offset,this._offset+len));
		this._offset+=len;
		return res;
	}
	public writeStr(str:string){
		const buff = Encoder.encode(str);
		this.writeVarUInt(buff.length);
		this.writeArr(buff);
	}
	public check(arr:number[]){
		//return this.data[this.index++];
		let i;
		for(i=0;i<arr.length;i++){
			if(arr[i]!=this.readUInt8()) break;
		}
		return i;
	}
	public writeArr(arr:Uint8Array|number[]){
		arr.forEach((data) => this.writeUInt8(data));
	}
}