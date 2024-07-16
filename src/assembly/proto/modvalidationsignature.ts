import { Writer, Reader } from "as-proto";

export namespace modvalidationsignature {
  export class account_id {
    static encode(message: account_id, writer: Writer): void {
      const unique_name_value = message.value;
      if (unique_name_value !== null) {
        writer.uint32(10);
        writer.bytes(unique_name_value);
      }
    }

    static decode(reader: Reader, length: i32): account_id {
      const end: usize = length < 0 ? reader.end : reader.ptr + length;
      const message = new account_id();

      while (reader.ptr < end) {
        const tag = reader.uint32();
        switch (tag >>> 3) {
          case 1:
            message.value = reader.bytes();
            break;

          default:
            reader.skipType(tag & 7);
            break;
        }
      }

      return message;
    }

    value: Uint8Array | null;

    constructor(value: Uint8Array | null = null) {
      this.value = value;
    }
  }

  export class config_storage {
    static encode(message: config_storage, writer: Writer): void {
      const unique_name_only_entry_points = message.only_entry_points;
      if (unique_name_only_entry_points.length !== 0) {
        for (let i = 0; i < unique_name_only_entry_points.length; ++i) {
          writer.uint32(8);
          writer.uint32(unique_name_only_entry_points[i]);
        }
      }

      if (message.threshold != 0) {
        writer.uint32(16);
        writer.uint32(message.threshold);
      }
    }

    static decode(reader: Reader, length: i32): config_storage {
      const end: usize = length < 0 ? reader.end : reader.ptr + length;
      const message = new config_storage();

      while (reader.ptr < end) {
        const tag = reader.uint32();
        switch (tag >>> 3) {
          case 1:
            message.only_entry_points.push(reader.uint32());
            break;

          case 2:
            message.threshold = reader.uint32();
            break;

          default:
            reader.skipType(tag & 7);
            break;
        }
      }

      return message;
    }

    only_entry_points: Array<u32>;
    threshold: u32;

    constructor(only_entry_points: Array<u32> = [], threshold: u32 = 0) {
      this.only_entry_points = only_entry_points;
      this.threshold = threshold;
    }
  }

  @unmanaged
  export class add_only_entry_point_args {
    static encode(message: add_only_entry_point_args, writer: Writer): void {
      if (message.entry_point != 0) {
        writer.uint32(8);
        writer.uint32(message.entry_point);
      }
    }

    static decode(reader: Reader, length: i32): add_only_entry_point_args {
      const end: usize = length < 0 ? reader.end : reader.ptr + length;
      const message = new add_only_entry_point_args();

      while (reader.ptr < end) {
        const tag = reader.uint32();
        switch (tag >>> 3) {
          case 1:
            message.entry_point = reader.uint32();
            break;

          default:
            reader.skipType(tag & 7);
            break;
        }
      }

      return message;
    }

    entry_point: u32;

    constructor(entry_point: u32 = 0) {
      this.entry_point = entry_point;
    }
  }

  @unmanaged
  export class remove_only_entry_point_args {
    static encode(message: remove_only_entry_point_args, writer: Writer): void {
      if (message.entry_point != 0) {
        writer.uint32(8);
        writer.uint32(message.entry_point);
      }
    }

    static decode(reader: Reader, length: i32): remove_only_entry_point_args {
      const end: usize = length < 0 ? reader.end : reader.ptr + length;
      const message = new remove_only_entry_point_args();

      while (reader.ptr < end) {
        const tag = reader.uint32();
        switch (tag >>> 3) {
          case 1:
            message.entry_point = reader.uint32();
            break;

          default:
            reader.skipType(tag & 7);
            break;
        }
      }

      return message;
    }

    entry_point: u32;

    constructor(entry_point: u32 = 0) {
      this.entry_point = entry_point;
    }
  }

  export class get_only_entry_points_result {
    static encode(message: get_only_entry_points_result, writer: Writer): void {
      const unique_name_value = message.value;
      if (unique_name_value.length !== 0) {
        for (let i = 0; i < unique_name_value.length; ++i) {
          writer.uint32(8);
          writer.uint32(unique_name_value[i]);
        }
      }
    }

    static decode(reader: Reader, length: i32): get_only_entry_points_result {
      const end: usize = length < 0 ? reader.end : reader.ptr + length;
      const message = new get_only_entry_points_result();

      while (reader.ptr < end) {
        const tag = reader.uint32();
        switch (tag >>> 3) {
          case 1:
            message.value.push(reader.uint32());
            break;

          default:
            reader.skipType(tag & 7);
            break;
        }
      }

      return message;
    }

    value: Array<u32>;

    constructor(value: Array<u32> = []) {
      this.value = value;
    }
  }

  @unmanaged
  export class set_threshold {
    static encode(message: set_threshold, writer: Writer): void {
      if (message.value != 0) {
        writer.uint32(8);
        writer.uint32(message.value);
      }
    }

    static decode(reader: Reader, length: i32): set_threshold {
      const end: usize = length < 0 ? reader.end : reader.ptr + length;
      const message = new set_threshold();

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

  @unmanaged
  export class get_threshold {
    static encode(message: get_threshold, writer: Writer): void {
      if (message.value != 0) {
        writer.uint32(8);
        writer.uint32(message.value);
      }
    }

    static decode(reader: Reader, length: i32): get_threshold {
      const end: usize = length < 0 ? reader.end : reader.ptr + length;
      const message = new get_threshold();

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
