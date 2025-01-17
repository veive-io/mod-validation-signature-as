import { Writer, Reader } from "as-proto";

export namespace modvalidationsignature {
  @unmanaged
  export class threshold {
    static encode(message: threshold, writer: Writer): void {
      if (message.value != 0) {
        writer.uint32(8);
        writer.uint32(message.value);
      }
    }

    static decode(reader: Reader, length: i32): threshold {
      const end: usize = length < 0 ? reader.end : reader.ptr + length;
      const message = new threshold();

      while (reader.ptr < end) {
        const tag = reader.uint32();
        switch (tag >>> 3) {
          case 1:
            message.value = reader.uint32();
            break;

          default:
            reader.skipType(tag & 7);
            break;
        }
      }

      return message;
    }

    value: u32;

    constructor(value: u32 = 0) {
      this.value = value;
    }
  }

  export class set_threshold_args {
    static encode(message: set_threshold_args, writer: Writer): void {
      const unique_name_user = message.user;
      if (unique_name_user !== null) {
        writer.uint32(10);
        writer.bytes(unique_name_user);
      }

      if (message.value != 0) {
        writer.uint32(16);
        writer.uint32(message.value);
      }
    }

    static decode(reader: Reader, length: i32): set_threshold_args {
      const end: usize = length < 0 ? reader.end : reader.ptr + length;
      const message = new set_threshold_args();

      while (reader.ptr < end) {
        const tag = reader.uint32();
        switch (tag >>> 3) {
          case 1:
            message.user = reader.bytes();
            break;

          case 2:
            message.value = reader.uint32();
            break;

          default:
            reader.skipType(tag & 7);
            break;
        }
      }

      return message;
    }

    user: Uint8Array | null;
    value: u32;

    constructor(user: Uint8Array | null = null, value: u32 = 0) {
      this.user = user;
      this.value = value;
    }
  }

  export class get_threshold_args {
    static encode(message: get_threshold_args, writer: Writer): void {
      const unique_name_user = message.user;
      if (unique_name_user !== null) {
        writer.uint32(10);
        writer.bytes(unique_name_user);
      }

      if (message.value != 0) {
        writer.uint32(16);
        writer.uint32(message.value);
      }
    }

    static decode(reader: Reader, length: i32): get_threshold_args {
      const end: usize = length < 0 ? reader.end : reader.ptr + length;
      const message = new get_threshold_args();

      while (reader.ptr < end) {
        const tag = reader.uint32();
        switch (tag >>> 3) {
          case 1:
            message.user = reader.bytes();
            break;

          case 2:
            message.value = reader.uint32();
            break;

          default:
            reader.skipType(tag & 7);
            break;
        }
      }

      return message;
    }

    user: Uint8Array | null;
    value: u32;

    constructor(user: Uint8Array | null = null, value: u32 = 0) {
      this.user = user;
      this.value = value;
    }
  }

  @unmanaged
  export class get_threshold_result {
    static encode(message: get_threshold_result, writer: Writer): void {
      if (message.value != 0) {
        writer.uint32(8);
        writer.uint32(message.value);
      }
    }

    static decode(reader: Reader, length: i32): get_threshold_result {
      const end: usize = length < 0 ? reader.end : reader.ptr + length;
      const message = new get_threshold_result();

      while (reader.ptr < end) {
        const tag = reader.uint32();
        switch (tag >>> 3) {
          case 1:
            message.value = reader.uint32();
            break;

          default:
            reader.skipType(tag & 7);
            break;
        }
      }

      return message;
    }

    value: u32;

    constructor(value: u32 = 0) {
      this.value = value;
    }
  }
}
