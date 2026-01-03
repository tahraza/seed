use crate::error::Error;
use std::cmp::Ordering;

#[derive(Clone, PartialEq, Eq, Debug)]
pub struct BitVec {
    bits: Vec<u8>,
}

impl BitVec {
    pub fn new(width: usize, init: u8) -> Self {
        let v = if init == 0 { 0 } else { 1 };
        Self {
            bits: vec![v; width],
        }
    }

    pub fn width(&self) -> usize {
        self.bits.len()
    }

    pub fn get(&self, idx: usize) -> u8 {
        self.bits[idx]
    }

    pub fn set(&mut self, idx: usize, val: u8) {
        self.bits[idx] = if val == 0 { 0 } else { 1 };
    }

    pub fn from_u64(width: usize, mut val: u64) -> Self {
        let mut bits = Vec::with_capacity(width);
        for _ in 0..width {
            bits.push((val & 1) as u8);
            val >>= 1;
        }
        Self { bits }
    }

    pub fn from_i64(width: usize, val: i64) -> Self {
        let mut bits = Vec::with_capacity(width);
        let mut v = val as i128;
        for _ in 0..width {
            bits.push((v & 1) as u8);
            v >>= 1;
        }
        Self { bits }
    }

    pub fn from_bits_msb(s: &str) -> Result<Self, Error> {
        let mut bits = Vec::with_capacity(s.len());
        for ch in s.chars() {
            match ch {
                '0' => bits.push(0),
                '1' => bits.push(1),
                _ => return Err(Error::new("invalid bit literal")),
            }
        }
        bits.reverse();
        Ok(Self { bits })
    }

    pub fn from_hex_msb(s: &str) -> Result<Self, Error> {
        let mut bits = Vec::with_capacity(s.len() * 4);
        for ch in s.chars() {
            let nibble = ch.to_digit(16).ok_or_else(|| Error::new("invalid hex literal"))?;
            for i in (0..4).rev() {
                bits.push(((nibble >> i) & 1) as u8);
            }
        }
        bits.reverse();
        Ok(Self { bits })
    }

    pub fn from_bits_lsb(bits: Vec<u8>) -> Self {
        Self { bits }
    }

    pub fn to_u64_trunc(&self) -> u64 {
        let mut v = 0u64;
        let mut shift = 0u32;
        for bit in &self.bits {
            if *bit != 0 {
                v |= 1u64 << shift;
            }
            shift = shift.saturating_add(1);
            if shift >= 64 {
                break;
            }
        }
        v
    }

    pub fn resize_zero(&self, width: usize) -> Self {
        if width <= self.width() {
            let mut bits = self.bits[..width].to_vec();
            bits.truncate(width);
            return Self { bits };
        }
        let mut bits = self.bits.clone();
        bits.resize(width, 0);
        Self { bits }
    }

    pub fn resize_sign(&self, width: usize) -> Self {
        if width <= self.width() {
            let mut bits = self.bits[..width].to_vec();
            bits.truncate(width);
            return Self { bits };
        }
        let sign = if self.bits.is_empty() { 0 } else { *self.bits.last().unwrap() };
        let mut bits = self.bits.clone();
        bits.resize(width, sign);
        Self { bits }
    }

    pub fn concat(msb: &BitVec, lsb: &BitVec) -> Self {
        let mut bits = Vec::with_capacity(msb.width() + lsb.width());
        bits.extend_from_slice(&lsb.bits);
        bits.extend_from_slice(&msb.bits);
        Self { bits }
    }

    pub fn not(&self) -> Self {
        let bits = self.bits.iter().map(|b| if *b == 0 { 1 } else { 0 }).collect();
        Self { bits }
    }

    pub fn and(a: &BitVec, b: &BitVec) -> Self {
        let w = a.width().max(b.width());
        let aa = a.resize_zero(w);
        let bb = b.resize_zero(w);
        let mut bits = Vec::with_capacity(w);
        for i in 0..w {
            bits.push(if aa.bits[i] != 0 && bb.bits[i] != 0 { 1 } else { 0 });
        }
        Self { bits }
    }

    pub fn or(a: &BitVec, b: &BitVec) -> Self {
        let w = a.width().max(b.width());
        let aa = a.resize_zero(w);
        let bb = b.resize_zero(w);
        let mut bits = Vec::with_capacity(w);
        for i in 0..w {
            bits.push(if aa.bits[i] != 0 || bb.bits[i] != 0 { 1 } else { 0 });
        }
        Self { bits }
    }

    pub fn xor(a: &BitVec, b: &BitVec) -> Self {
        let w = a.width().max(b.width());
        let aa = a.resize_zero(w);
        let bb = b.resize_zero(w);
        let mut bits = Vec::with_capacity(w);
        for i in 0..w {
            bits.push(if aa.bits[i] != bb.bits[i] { 1 } else { 0 });
        }
        Self { bits }
    }

    pub fn add(a: &BitVec, b: &BitVec) -> Self {
        let w = a.width().max(b.width());
        let aa = a.resize_sign(w);
        let bb = b.resize_sign(w);
        let mut bits = Vec::with_capacity(w);
        let mut carry = 0u8;
        for i in 0..w {
            let sum = aa.bits[i] + bb.bits[i] + carry;
            bits.push(sum & 1);
            carry = if sum >= 2 { 1 } else { 0 };
        }
        Self { bits }
    }

    pub fn sub(a: &BitVec, b: &BitVec) -> Self {
        let w = a.width().max(b.width());
        let aa = a.resize_sign(w);
        let bb = b.resize_sign(w);
        let mut bits = Vec::with_capacity(w);
        let mut borrow = 0i8;
        for i in 0..w {
            let ai = aa.bits[i] as i8;
            let bi = bb.bits[i] as i8;
            let mut diff = ai - bi - borrow;
            if diff < 0 {
                diff += 2;
                borrow = 1;
            } else {
                borrow = 0;
            }
            bits.push((diff & 1) as u8);
        }
        Self { bits }
    }

    pub fn shl(a: &BitVec, count: usize) -> Self {
        let w = a.width();
        let mut bits = vec![0u8; w];
        for i in 0..w {
            if i + count < w {
                bits[i + count] = a.bits[i];
            }
        }
        Self { bits }
    }

    pub fn shr(a: &BitVec, count: usize) -> Self {
        let w = a.width();
        let mut bits = vec![0u8; w];
        for i in count..w {
            bits[i - count] = a.bits[i];
        }
        Self { bits }
    }

    pub fn cmp_unsigned(a: &BitVec, b: &BitVec) -> Ordering {
        let w = a.width().max(b.width());
        let aa = a.resize_zero(w);
        let bb = b.resize_zero(w);
        for i in (0..w).rev() {
            match aa.bits[i].cmp(&bb.bits[i]) {
                Ordering::Equal => continue,
                ord => return ord,
            }
        }
        Ordering::Equal
    }

    pub fn cmp_signed(a: &BitVec, b: &BitVec) -> Ordering {
        let w = a.width().max(b.width());
        let aa = a.resize_sign(w);
        let bb = b.resize_sign(w);
        let sa = *aa.bits.last().unwrap_or(&0);
        let sb = *bb.bits.last().unwrap_or(&0);
        if sa != sb {
            return if sa == 1 { Ordering::Less } else { Ordering::Greater };
        }
        Self::cmp_unsigned(&aa, &bb)
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum ValueKind {
    Arithmetic,
    Bitwise,
    Literal,
}

#[derive(Clone, PartialEq, Eq, Debug)]
pub struct Value {
    pub bits: BitVec,
    pub kind: ValueKind,
}

impl Value {
    pub fn bit(value: bool) -> Self {
        Self {
            bits: BitVec::new(1, if value { 1 } else { 0 }),
            kind: ValueKind::Literal,
        }
    }
}
